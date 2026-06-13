import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { categories, tasks } from "@shared/schema";
import { eq, like, or } from "drizzle-orm";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // One-time data migration: rename "Montagliste" → "Montagsliste (Dienstag TS17)"
  try {
    await db.update(categories)
      .set({ name: 'Montagsliste (Dienstag TS17)' })
      .where(eq(categories.name, 'Montagliste'));
  } catch (e) {
    console.error('[startup] Category rename failed (non-fatal):', e);
  }

  // One-time migration: rename "Mengenformular Mittagsschicht" → "Mengenformular Frühschicht"
  try {
    await db.update(categories)
      .set({ name: 'Mengenformular Frühschicht' })
      .where(eq(categories.name, 'Mengenformular Mittagsschicht'));
    log('[startup] Mengenformular Mittagsschicht → Frühschicht renamed');
  } catch (e) {
    console.error('[startup] Mengenformular rename failed (non-fatal):', e);
  }

  // One-time migration: archive standalone Mengenformular categories (merged into Küche Checkliste)
  // Cannot delete due to FK constraint; rename to [Archiv] prefix so they are hidden from employees
  try {
    await db.update(categories)
      .set({ name: '[Archiv] Mengenformular Frühschicht' })
      .where(eq(categories.name, 'Mengenformular Frühschicht'));
    await db.update(categories)
      .set({ name: '[Archiv] Mengenformular Spätschicht' })
      .where(eq(categories.name, 'Mengenformular Spätschicht'));
    log('[startup] Mengenformular categories archived (hidden from employees)');
  } catch (e) {
    console.error('[startup] Mengenformular archive failed (non-fatal):', e);
  }

  // Migration: set earlyShiftOnly=true for the Sonderlisten
  try {
    await db.update(categories)
      .set({ earlyShiftOnly: true })
      .where(or(
        like(categories.name, '%Montagsliste%'),
        like(categories.name, '%Mittwochsliste%'),
        like(categories.name, '%MHD-Check%'),
        like(categories.name, '%Samstagsreinigung%'),
        like(categories.name, '%Frühschicht%'),
      ));
    log('[startup] earlyShiftOnly set for Sonderlisten');
  } catch (e) {
    console.error('[startup] earlyShiftOnly migration failed (non-fatal):', e);
  }

  // Migration: move Sonder/Samstagsreinigung under Küche (was incorrectly under Terminal)
  try {
    const [kueche] = await db.select().from(categories).where(eq(categories.name, 'Küche'));
    if (kueche) {
      await db.update(categories)
        .set({ parentId: kueche.id })
        .where(like(categories.name, '%Samstagsreinigung%'));
      log('[startup] Sonder/Samstagsreinigung moved under Küche');
    }
  } catch (e) {
    console.error('[startup] Samstagsreinigung parent migration failed (non-fatal):', e);
  }

  // Seed: create Fahrer category + tasks if missing
  try {
    const existing = await db.select().from(categories).where(eq(categories.name, 'Fahrer'));
    if (existing.length === 0) {
      const [fahrerCat] = await db.insert(categories).values({
        name: 'Fahrer',
        description: 'Fahrzeug & Lieferung',
        icon: 'bike',
        useShifts: true,
        categoryType: 'shifts',
        parentId: null,
        isSubcategoryParent: false,
        enforceReading: false,
      }).returning();

      const fahrerTasks = [
        { title: 'Fahrzeug überprüfen',                         description: 'Öl, Reifen und allgemeinen Zustand prüfen',                           icon: 'car',              priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'schichtanfang' as const },
        { title: 'Lieferungen zuordnen',                         description: 'Lieferrouten organisieren',                                            icon: 'map',              priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'schichtanfang' as const },
        { title: 'Wechselgeld prüfen',                           description: 'Ausreichend Wechselgeld für Lieferungen sicherstellen',                icon: 'banknote',         priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'schichtanfang' as const },
        { title: 'Fahrzeug tanken',                              description: 'Lieferfahrzeug auffüllen',                                             icon: 'fuel',             priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'both' as const },
        { title: 'Liefertaschen reinigen',                       description: 'Liefertaschen reinigen und desinfizieren',                             icon: 'shopping-bag',     priority: 'high' as const,   shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Tagesabrechnung',                              description: 'Lieferberichte abschließen',                                           icon: 'receipt',          priority: 'high' as const,   shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Fahrer Regal Sauber machen und aufräumen',     description: 'Wo die Batterien sind',                                               icon: 'archive',          priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'both' as const },
        { title: 'Fahreraufgaben Kontrolieren',                  description: 'Fahrer haben ihr eigenes Forzacheck, einfach kontrollieren',          icon: 'clipboard-check',  priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'both' as const },
        { title: 'Fahrrad Box Reinigen',                         description: '',                                                                     icon: 'box',              priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Fahrräder Kontrollieren',                      description: 'Sauberkeit und Verkehrssicherheit, wenn defekt Schalau informieren',  icon: 'bicycle',          priority: 'high' as const,   shift: 'both' as const, shiftPhase: 'schichtanfang' as const },
        { title: 'Fahrräder Raus stellen',                       description: '',                                                                     icon: 'bicycle',          priority: 'medium' as const, shift: 'frühschicht' as const, shiftPhase: 'schichtanfang' as const },
        { title: 'Fahrräder Rein stellen',                       description: '',                                                                     icon: 'bicycle',          priority: 'medium' as const, shift: 'spätschicht' as const, shiftPhase: 'schichtende' as const },
        { title: 'Helme Reinigen',                               description: 'Jeder soll seinen Helm nach der Schicht selbst reinigen',             icon: 'shield',           priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Pizza Taschen Reinigen',                       description: 'Belege rauswerfen',                                                   icon: 'package',          priority: 'medium' as const, shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Akkus Aufladen',                               description: 'WICHTIG',                                                             icon: 'battery-charging', priority: 'high' as const,   shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Power Bank',                                   description: 'Beide da? Zum Laden anschließen WICHTIG',                             icon: 'zap',              priority: 'high' as const,   shift: 'both' as const, shiftPhase: 'schichtende' as const },
        { title: 'Power Banks zurück zum Terminal und aufladen', description: '',                                                                     icon: 'zap',              priority: 'high' as const,   shift: 'both' as const, shiftPhase: 'schichtende' as const },
      ];

      await db.insert(tasks).values(
        fahrerTasks.map(t => ({
          categoryId: fahrerCat.id,
          title: t.title,
          description: t.description || null,
          icon: t.icon,
          priority: t.priority,
          estimatedMinutes: '5',
          shift: t.shift,
          shiftPhase: t.shiftPhase,
          stores: ['JP23', 'KP5', 'TS17'],
        }))
      );
      log('[startup] Fahrer category + 17 tasks created');
    }
  } catch (e) {
    console.error('[startup] Fahrer seed failed (non-fatal):', e);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err);
    res.status(status).json({ message });
    
    // Don't throw in production to prevent process crash
    if (app.get("env") === "development") {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown so the port is released before a restart starts a new process
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000); // force-exit after 3 s if still hanging
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT",  shutdown);
})();
