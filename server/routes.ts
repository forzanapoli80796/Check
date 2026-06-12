import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { sendKugelnWarningEmail } from "./email";
import { insertCategorySchema, insertTaskSchema, insertChecklistSchema, insertTeigProductionSchema, insertInventoryItemSchema } from "@shared/schema";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import path from "path";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin verification
  app.post("/api/admin/verify", async (req, res) => {
    try {
      const { code } = req.body;
      const storage = await getStorage();
      const adminPassword = await storage.getAppSetting("admin_password");
      
      // Default to "0001" if not set
      const correctPassword = adminPassword?.settingValue || "0001";
      
      if (code === correctPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: "Invalid admin code" });
      }
    } catch (error) {
      console.error("Error verifying admin code:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Admin backup export
  app.get("/api/admin/backup", async (req, res) => {
    try {
      const storage = await getStorage();
      const [
        cats,
        taskList,
        checklists,
        teigProd,
        inventoryItems,
        employeeMessages,
      ] = await Promise.all([
        storage.getCategories(),
        storage.getTasks(),
        storage.getChecklists(),
        storage.getTeigProduction(),
        storage.getInventoryItems(),
        storage.getEmployeeMessages(),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        version: 1,
        data: {
          categories: cats,
          tasks: taskList,
          checklists,
          teigProduction: teigProd,
          inventoryItems,
          employeeMessages,
        },
      };

      const date = new Date().toISOString().slice(0, 10);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="forzacheck-backup-${date}.json"`);
      res.json(backup);
    } catch (error) {
      console.error("Backup error:", error);
      res.status(500).json({ message: "Backup konnte nicht erstellt werden" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    const storage = await getStorage();
    const categories = await storage.getCategories();
    res.json(categories);
  });
  
  app.get("/api/categories/:id", async (req, res) => {
    const storage = await getStorage();
    const categories = await storage.getCategories();
    const category = categories.find(c => c.id === req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });

  app.get("/api/categories/:id/subcategories", async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const storage = await getStorage();
    const subcategories = await storage.getSubcategories(req.params.id);
    res.json(subcategories);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ success: true });
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    const storage = await getStorage();
    const tasks = await storage.getTasks();
    
    // Filter by store if provided
    const { store } = req.query;
    if (store && typeof store === 'string') {
      const filteredTasks = tasks.filter(task => 
        task.stores && task.stores.includes(store)
      );
      return res.json(filteredTasks);
    }
    
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const storage = await getStorage();
      const taskData = {
        ...req.body,
        icon: req.body.icon || "clipboard-list", // Default icon
        estimatedMinutes: String(req.body.estimatedMinutes || 5), // Convert to string
      };
      // Convert old format to new format for backwards compatibility
      if (taskData.shift === 'früh') taskData.shift = 'frühschicht';
      if (taskData.shift === 'spät') taskData.shift = 'spätschicht';
      
      const validatedData = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      // Convert old format to new format for backwards compatibility
      const updateData = { ...req.body };
      if (updateData.shift === 'früh') updateData.shift = 'frühschicht';
      if (updateData.shift === 'spät') updateData.shift = 'spätschicht';
      if (updateData.estimatedMinutes !== undefined) {
        updateData.estimatedMinutes = String(updateData.estimatedMinutes);
      }
      
      const validatedData = insertTaskSchema.partial().parse(updateData);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ 
        message: "Fehler beim Löschen der Aufgabe",
        code: "DATABASE_ERROR"
      });
    }
  });

  // Checklists routes
  app.get("/api/checklists", async (req, res) => {
    const storage = await getStorage();
    let checklists = await storage.getChecklists();
    
    // Filter by store if provided
    const { store, startDate, endDate } = req.query;
    
    if (store && typeof store === 'string' && store !== 'alle') {
      checklists = checklists.filter(checklist => checklist.store === store);
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      checklists = checklists.filter(checklist => {
        if (!checklist.submittedAt) return false;
        const submittedDate = new Date(checklist.submittedAt);
        return submittedDate >= start && submittedDate <= end;
      });
    }
    
    res.json(checklists);
  });

  // Missing checklists overview: which expected checklists were NOT submitted on a given day
  app.get("/api/missing-checklists", async (req, res) => {
    try {
      const storage = await getStorage();
      const { date } = req.query;

      // Determine target date (default: yesterday)
      let targetDate: Date;
      if (date && typeof date === 'string') {
        targetDate = new Date(date);
      } else {
        targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - 1);
      }

      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Load data
      const allCategories = await storage.getCategories();
      const allTasks = await storage.getTasks();
      const allChecklists = await storage.getChecklists();

      // Filter checklists submitted on the target day
      const dayChecklists = allChecklists.filter(c => {
        if (!c.submittedAt) return false;
        const d = new Date(c.submittedAt);
        return d >= dayStart && d <= dayEnd;
      });

      // Only consider categories that are checklist-relevant (not whiteboard, not parent containers)
      const relevantCategories = allCategories.filter(cat =>
        cat.categoryType !== 'whiteboard' &&
        !cat.isSubcategoryParent
      );

      const STORES = ['JP23', 'KP5', 'TS17'];
      const SHIFT_COMBOS = [
        'frühschicht_schichtanfang',
        'frühschicht_schichtende',
        'spätschicht_schichtanfang',
        'spätschicht_schichtende',
      ];

      const missing: Array<{
        categoryId: string;
        categoryName: string;
        store: string;
        shiftType: string;
      }> = [];

      for (const cat of relevantCategories) {
        const catTasks = allTasks.filter(t => t.categoryId === cat.id);

        for (const store of STORES) {
          const storeTasks = catTasks.filter(t =>
            !t.stores || t.stores.length === 0 || t.stores.includes(store)
          );

          if (storeTasks.length === 0) continue; // No tasks for this store → skip

          if (cat.useShifts) {
            // Determine which shift combos are expected based on tasks
            const excluded = cat.excludedShiftCombos ?? [];
            const expectedCombos = SHIFT_COMBOS.filter(combo => {
              if (excluded.includes(combo)) return false;
              const [shift, phase] = combo.split('_') as [string, string];
              return storeTasks.some(t =>
                (t.shift === shift || t.shift === 'both') &&
                (t.shiftPhase === phase || t.shiftPhase === 'both')
              );
            });

            for (const shiftType of expectedCombos) {
              const submitted = dayChecklists.some(
                c => c.categoryId === cat.id && c.store === store && c.shiftType === shiftType
              );
              if (!submitted) {
                missing.push({ categoryId: cat.id, categoryName: cat.name, store, shiftType });
              }
            }
          } else {
            // Simple/inventory: expect one submission per store
            const submitted = dayChecklists.some(
              c => c.categoryId === cat.id && c.store === store
            );
            if (!submitted) {
              missing.push({ categoryId: cat.id, categoryName: cat.name, store, shiftType: 'keine_schicht' });
            }
          }
        }
      }

      // All day-restricted categories use "next-day" reporting:
      // They are excluded from the general missing pool and handled by dedicated daily handlers.
      // Each handler checks the PREVIOUS day's submissions when the admin views the NEXT day.
      // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

      // Derive local day-of-week from the date query param (or targetDate) to avoid UTC shift
      const dateStr = typeof date === 'string' ? date : targetDate.toISOString().split('T')[0];
      const [yr, mo, dy] = dateStr.split('-').map(Number);
      const targetDayOfWeek = new Date(yr, mo - 1, dy).getDay();

      // Helper: filter already-loaded allChecklists by a local date (avoids broken getChecklistsByDateRange)
      const checklistsForLocalDate = (localDy: number) => {
        const d = new Date(yr, mo - 1, localDy);
        const start = new Date(d); start.setHours(0, 0, 0, 0);
        const end = new Date(d); end.setHours(23, 59, 59, 999);
        return allChecklists.filter(c => {
          if (!c.submittedAt) return false;
          const ts = new Date(c.submittedAt);
          return ts >= start && ts <= end;
        });
      };

      // Day-restricted category names — excluded from the general pool entirely
      const DAY_RESTRICTED_NAMES = new Set([
        'Montagsliste (Dienstag TS17)',
        'Mittwochsliste',
        'Sonder/Samstagsreinigung',
        'MHD-Check',
      ]);

      const filteredMissing = missing.filter(entry => {
        const nameLower = entry.categoryName.toLowerCase();
        // INVENTUR/NON-FOOD: never show as missing
        if (nameLower.includes('inventur') || nameLower.includes('non-food')) return false;
        // All day-restricted categories: handled by dedicated daily handlers below
        if (DAY_RESTRICTED_NAMES.has(entry.categoryName)) return false;
        return true;
      });

      // Rule: submitted on Day X → error appears ONLY on Day X+1 (Folgetag).
      // Admin defaults to yesterday, so selectedDate = Day X → targetDayOfWeek = X's DOW.
      // Each handler checks the selected day itself (dy), not dy-1.
      // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

      // ── MONDAY selected (admin opened Tuesday): Montagsliste JP23 + KP5 ──────
      if (targetDayOfWeek === 1) {
        const dayChecklists = checklistsForLocalDate(dy);
        const cat = allCategories.find(c => c.name === 'Montagsliste (Dienstag TS17)');
        if (cat) {
          for (const store of ['JP23', 'KP5']) {
            const submitted = dayChecklists.some(c => c.categoryId === cat.id && c.store === store);
            if (!submitted) filteredMissing.push({ categoryId: cat.id, categoryName: cat.name, store, shiftType: 'keine_schicht' });
          }
        }
      }

      // ── TUESDAY selected (admin opened Wednesday): Montagsliste TS17 ─────────
      if (targetDayOfWeek === 2) {
        const dayChecklists = checklistsForLocalDate(dy);
        const cat = allCategories.find(c => c.name === 'Montagsliste (Dienstag TS17)');
        if (cat) {
          const submitted = dayChecklists.some(c => c.categoryId === cat.id && c.store === 'TS17');
          if (!submitted) filteredMissing.push({ categoryId: cat.id, categoryName: cat.name, store: 'TS17', shiftType: 'keine_schicht' });
        }
      }

      // ── WEDNESDAY selected (admin opened Thursday): Mittwochsliste ──────────
      if (targetDayOfWeek === 3) {
        const dayChecklists = checklistsForLocalDate(dy);
        const cat = allCategories.find(c => c.name === 'Mittwochsliste');
        if (cat) {
          for (const store of STORES) {
            const submitted = dayChecklists.some(c => c.categoryId === cat.id && c.store === store);
            if (!submitted) filteredMissing.push({ categoryId: cat.id, categoryName: cat.name, store, shiftType: 'keine_schicht' });
          }
        }
      }

      // ── FRIDAY selected (admin opened Saturday): MHD-Check ──────────────────
      if (targetDayOfWeek === 5) {
        const dayChecklists = checklistsForLocalDate(dy);
        const cat = allCategories.find(c => c.name === 'MHD-Check');
        if (cat) {
          for (const store of STORES) {
            const submitted = dayChecklists.some(c => c.categoryId === cat.id && c.store === store);
            if (!submitted) filteredMissing.push({ categoryId: cat.id, categoryName: cat.name, store, shiftType: 'keine_schicht' });
          }
        }
      }

      // ── SATURDAY selected (admin opened Sunday): Sonder/Samstagsreinigung ───
      if (targetDayOfWeek === 6) {
        const dayChecklists = checklistsForLocalDate(dy);
        const cat = allCategories.find(c => c.name === 'Sonder/Samstagsreinigung');
        if (cat) {
          for (const store of STORES) {
            const submitted = dayChecklists.some(c => c.categoryId === cat.id && c.store === store);
            if (!submitted) filteredMissing.push({ categoryId: cat.id, categoryName: cat.name, store, shiftType: 'keine_schicht' });
          }
        }
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        date: dateStr,
        totalMissing: filteredMissing.length,
        missing: filteredMissing,
        submittedCount: dayChecklists.length,
      });
    } catch (error) {
      console.error("Error computing missing checklists:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      const storage = await getStorage();
      
      // Extract special fields before validation
      const { 
        mhdExpiryDate, 
        mhdProductDetails, 
        lateShiftDate,
        ballsForTomorrow,
        newBalls,
        lunchShiftDate,
        ballsForToday,
        redBags,
        blackBags,
        completionDate,
        ...baseData 
      } = req.body;
      
      // Validate base checklist data
      const validatedData = insertChecklistSchema.parse(baseData);
      
      // Add special fields if present
      const checklistData: any = {
        ...validatedData,
        mhdExpiryDate: mhdExpiryDate || null,
        mhdProductDetails: mhdProductDetails || null,
        lateShiftDate: lateShiftDate || null,
        ballsForTomorrow: ballsForTomorrow || null,
        newBalls: newBalls || null,
        lunchShiftDate: lunchShiftDate || null,
        ballsForToday: ballsForToday || null,
        redBags: redBags != null ? redBags : null,
        blackBags: blackBags != null ? blackBags : null,
        completionDate: completionDate || null
      };
      
      const checklist = await storage.createChecklist(checklistData);
      res.json(checklist);
    } catch (error) {
      console.error("Checklist creation error:", error);
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  // Delete all checklists older than 7 days
  app.delete("/api/checklists/old", async (req, res) => {
    try {
      const storage = await getStorage();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago
      
      // Get all checklists
      const allChecklists = await storage.getChecklists();
      
      // Filter checklists older than 7 days
      const oldChecklists = allChecklists.filter(checklist => {
        if (!checklist.submittedAt) return false;
        const submittedDate = new Date(checklist.submittedAt);
        return submittedDate < cutoffDate;
      });
      
      // Delete each old checklist
      let deletedCount = 0;
      for (const checklist of oldChecklists) {
        const success = await storage.deleteChecklist(checklist.id);
        if (success) deletedCount++;
      }
      
      res.json({ 
        success: true, 
        deletedCount,
        message: `${deletedCount} Checklisten älter als 7 Tage wurden gelöscht.`
      });
    } catch (error) {
      console.error("Error deleting old checklists:", error);
      res.status(500).json({ message: "Fehler beim Löschen der alten Checklisten" });
    }
  });

  app.delete("/api/checklists/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteChecklist(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Checklist not found" });
    }
    res.json({ success: true });
  });


  // Teig Production routes
  app.get("/api/teig-production", async (req, res) => {
    const storage = await getStorage();
    const productions = await storage.getTeigProduction();

    // Auto-archive: if the current ISO week has no history yet, snapshot all current values now.
    // This ensures the archive is populated even when no individual "Speichern" click happened.
    if (productions.length > 0) {
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const currentKw = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const currentYear = d.getUTCFullYear();

      const existing = await storage.getTeigProductionHistoryByWeek(currentKw, currentYear);
      if (existing.length === 0) {
        await Promise.all(
          productions.map(p =>
            storage.upsertTeigProductionHistory(currentKw, currentYear, p.weekday, p.store, p.kugelMenge)
          )
        );
      }
    }

    res.json(productions);
  });

  app.get("/api/teig-production/:weekday/:store", async (req, res) => {
    const storage = await getStorage();
    const production = await storage.getTeigProductionByWeekdayStore(Number(req.params.weekday), req.params.store);
    if (!production) {
      // Return default if not found
      return res.json({ weekday: Number(req.params.weekday), store: req.params.store, kugelMenge: 0 });
    }
    res.json(production);
  });

  app.put("/api/teig-production", async (req, res) => {
    try {
      const storage = await getStorage();
      const { weekday, store, kugelMenge } = req.body;
      
      if (weekday === undefined || !store || kugelMenge === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const production = await storage.upsertTeigProduction(weekday, store, kugelMenge);

      // Auto-archive: save historical snapshot for the current ISO week
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const currentKw = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const currentYear = d.getUTCFullYear();
      await storage.upsertTeigProductionHistory(currentKw, currentYear, weekday, store, kugelMenge);

      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Invalid production data" });
    }
  });

  app.get("/api/teig-production-history", async (req, res) => {
    try {
      const storage = await getStorage();
      const kw = parseInt(req.query.kw as string);
      const year = parseInt(req.query.year as string);
      if (!kw || !year) return res.status(400).json({ message: "Missing kw or year" });
      const history = await storage.getTeigProductionHistoryByWeek(kw, year);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Upcoming week info: Bavarian holidays + FC Bayern home games
  app.get("/api/upcoming-week-info", async (_req, res) => {
    try {
      // Upload day is always Monday. Start from today if it's Monday, else next Monday.
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
      const daysUntilMonday = dayOfWeek === 1 ? 0 : (dayOfWeek === 0 ? 1 : 8 - dayOfWeek);
      const uploadMonday = new Date(today);
      uploadMonday.setDate(today.getDate() + daysUntilMonday);
      uploadMonday.setHours(0, 0, 0, 0);
      // Show the next 10 days: Mon to Mon+9
      const rangeEndDate = new Date(uploadMonday);
      rangeEndDate.setDate(uploadMonday.getDate() + 9);
      rangeEndDate.setHours(23, 59, 59, 999);

      const isoDate = (d: Date) => d.toISOString().slice(0, 10);
      const rangeStart = isoDate(uploadMonday);
      const rangeEnd = isoDate(rangeEndDate);
      // Collect unique years covered by the range (handles year-end crossover)
      const years = Array.from(new Set([uploadMonday.getFullYear(), rangeEndDate.getFullYear()]));

      // -- 1. Bavarian public holidays (fetch all years covered by the range) --
      type HolidayAPIResponse = Record<string, { datum: string; hinweis: string }>;
      const holidayDataArr = await Promise.all(
        years.map(y =>
          fetch(`https://feiertage-api.de/api/?jahr=${y}&nur_land=BY`)
            .then(r => r.json() as Promise<HolidayAPIResponse>)
            .catch(() => ({} as HolidayAPIResponse))
        )
      );
      const holidayData = Object.assign({}, ...holidayDataArr) as HolidayAPIResponse;

      const holidaysInWeek = Object.entries(holidayData)
        .filter(([, v]) => v.datum >= rangeStart && v.datum <= rangeEnd)
        .map(([name, v]) => ({ name, datum: v.datum }));

      // -- 2. FC Bayern ALL games from OpenLigaDB (Bundesliga + DFB-Pokal) --
      interface OpenLigaMatch {
        matchDateTimeUTC: string;
        team1: { teamName: string };
        team2: { teamName: string };
        group: { groupOrderID: number };
      }

      let bayernGames: { competition: string; date: string; opponent: string; isHome: boolean }[] = [];

      try {
        // Get current matchday first
        const groupRes = await fetch("https://api.openligadb.de/getcurrentgroup/bl1");
        const group = (await groupRes.json()) as { groupOrderID: number };
        const currentMD = group.groupOrderID;
        const blYear = uploadMonday.getFullYear();

        // Fetch current + next 4 matchdays to cover the full 10-day window
        const matchdayFetches = await Promise.all(
          [currentMD, currentMD + 1, currentMD + 2, currentMD + 3, currentMD + 4].map(md =>
            fetch(`https://api.openligadb.de/getmatchdata/bl1/${blYear - 1}/${md}`)
              .then(r => r.json() as Promise<OpenLigaMatch[]>)
              .catch(() => [] as OpenLigaMatch[])
          )
        );

        const allMatches = matchdayFetches.flat();
        for (const match of allMatches) {
          const matchDate = match.matchDateTimeUTC?.slice(0, 10);
          if (!matchDate || matchDate < rangeStart || matchDate > rangeEnd) continue;
          const isHome = match.team1?.teamName?.includes("Bayern") ?? false;
          if (!isHome) continue; // only home games
          bayernGames.push({
            competition: "Bundesliga",
            date: matchDate,
            opponent: match.team2?.teamName ?? "?",
            isHome: true,
          });
        }
      } catch (err) {
        console.warn("OpenLigaDB BL1 fetch failed:", err);
      }

      // -- 3. DFB-Pokal from OpenLigaDB (league "dfb") -- Bayern HOME games only
      try {
        const dfbYear = uploadMonday.getFullYear();
        const dfbRes = await fetch(
          `https://api.openligadb.de/getmatchdata/dfb/${dfbYear}`
        );
        if (dfbRes.ok) {
          const dfbMatches = (await dfbRes.json()) as OpenLigaMatch[];
          for (const match of dfbMatches) {
            const matchDate = match.matchDateTimeUTC?.slice(0, 10);
            if (!matchDate || matchDate < rangeStart || matchDate > rangeEnd) continue;
            const isHome = match.team1?.teamName?.includes("Bayern") ?? false;
            if (!isHome) continue; // only home games
            bayernGames.push({
              competition: "DFB-Pokal",
              date: matchDate,
              opponent: match.team2?.teamName ?? "?",
              isHome: true,
            });
          }
        }
      } catch { /* ignore */ }

      // -- 4. UEFA Champions League -- ALL Bayern games (home + away)
      try {
        const uclYear = uploadMonday.getFullYear() - 1; // e.g. 2025 for 2025/26 season
        const clGroupRes = await fetch("https://api.openligadb.de/getcurrentgroup/ucl");
        if (clGroupRes.ok) {
          const clGroup = (await clGroupRes.json()) as { groupOrderID: number };
          const currentCLMD = clGroup.groupOrderID;
          const clFetches = await Promise.all(
            [currentCLMD - 1, currentCLMD, currentCLMD + 1, currentCLMD + 2]
              .filter(md => md > 0)
              .map(md =>
                fetch(`https://api.openligadb.de/getmatchdata/ucl/${uclYear}/${md}`)
                  .then(r => r.json() as Promise<OpenLigaMatch[]>)
                  .catch(() => [] as OpenLigaMatch[])
              )
          );
          const clMatches = clFetches.flat();
          for (const match of clMatches) {
            const matchDate = match.matchDateTimeUTC?.slice(0, 10);
            if (!matchDate || matchDate < rangeStart || matchDate > rangeEnd) continue;
            const isHome = match.team1?.teamName?.includes("Bayern") ?? false;
            const isAway = match.team2?.teamName?.includes("Bayern") ?? false;
            if (!isHome && !isAway) continue;
            bayernGames.push({
              competition: "Champions League",
              date: matchDate,
              opponent: isHome ? (match.team2?.teamName ?? "?") : (match.team1?.teamName ?? "?"),
              isHome,
            });
          }
        }
      } catch { /* ignore */ }

      // -- 5. Deutschland Nationalmannschaft Herren -- ALL games
      try {
        const deYear = uploadMonday.getFullYear();
        const isGermany = (name: string) =>
          name.toLowerCase().includes("deutschland") || name.toLowerCase().includes("germany");

        // Try WM 2026 qualifiers and Nations League league codes
        const deLeagueCodes = [
          `wm26qual/${deYear}`,
          `wm26qual/${deYear - 1}`,
          `nl24/${deYear - 1}`,
          `nl24/${deYear}`,
          `nationsleague/${deYear}`,
          `nationsleague/${deYear - 1}`,
        ];
        const deSeenDates = new Set<string>();
        for (const code of deLeagueCodes) {
          try {
            const deRes = await fetch(`https://api.openligadb.de/getmatchdata/${code}`);
            if (!deRes.ok) continue;
            const deMatches = (await deRes.json()) as OpenLigaMatch[];
            if (!Array.isArray(deMatches)) continue;
            for (const match of deMatches) {
              const matchDate = match.matchDateTimeUTC?.slice(0, 10);
              if (!matchDate || matchDate < rangeStart || matchDate > rangeEnd) continue;
              const t1 = match.team1?.teamName ?? "";
              const t2 = match.team2?.teamName ?? "";
              const deIsHome = isGermany(t1);
              const deIsAway = isGermany(t2);
              if (!deIsHome && !deIsAway) continue;
              const key = matchDate + (deIsHome ? t2 : t1);
              if (deSeenDates.has(key)) continue;
              deSeenDates.add(key);
              bayernGames.push({
                competition: "Deutschland Herren",
                date: matchDate,
                opponent: deIsHome ? t2 : t1,
                isHome: deIsHome,
              });
            }
          } catch { /* ignore league code */ }
        }
      } catch { /* ignore */ }

      // -- 6. Weather forecast for Munich (Open-Meteo, no API key needed) --
      interface WeatherDay {
        date: string;
        tempMax: number;
        tempMin: number;
        precipMm: number;
        wmoCode: number;
        windKmh: number;
        icon: string;
        label: string;
        prognosis: string; // delivery impact
      }

      // WMO code → short German label + emoji icon
      const wmoLabel = (code: number): { icon: string; label: string } => {
        if (code === 0)             return { icon: "☀️",  label: "Klarer Himmel" };
        if (code <= 2)              return { icon: "🌤️", label: "Leicht bewölkt" };
        if (code === 3)             return { icon: "☁️",  label: "Bedeckt" };
        if (code <= 48)             return { icon: "🌫️", label: "Nebel" };
        if (code <= 57)             return { icon: "🌦️", label: "Nieselregen" };
        if (code <= 67)             return { icon: "🌧️", label: "Regen" };
        if (code <= 77)             return { icon: "🌨️", label: "Schnee" };
        if (code <= 82)             return { icon: "🌦️", label: "Regenschauer" };
        if (code <= 86)             return { icon: "🌨️", label: "Schneeschauer" };
        return                             { icon: "⛈️",  label: "Gewitter" };
      };

      // General weather note for admin info
      const deliveryPrognosis = (code: number, tempMax: number, precipMm: number): string => {
        const isRainy = precipMm > 1 || (code >= 51 && code <= 99);
        const isHot   = tempMax >= 24;
        const isCold  = tempMax <= 8;
        const isSnow  = code >= 71 && code <= 77;

        if (isSnow)   return "Schnee erwartet – Straßenverhältnisse beachten";
        if (isRainy)  return "Regen erwartet – " + precipMm + " mm Niederschlag";
        if (isHot)    return "Sehr warm – Höchsttemperatur " + tempMax + "°C";
        if (isCold)   return "Kalt – Höchsttemperatur nur " + tempMax + "°C";
        return                "Normales Wetter";
      };

      let weatherDays: WeatherDay[] = [];
      try {
        const wRes = await fetch(
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=48.1351&longitude=11.5820" +
          "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max" +
          "&timezone=Europe%2FBerlin&forecast_days=14"
        );
        const wData = (await wRes.json()) as {
          daily: {
            time: string[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
            precipitation_sum: number[];
            weathercode: number[];
            windspeed_10m_max: number[];
          };
        };

        const times = wData.daily.time;
        for (let i = 0; i < times.length; i++) {
          const date = times[i];
          if (date < rangeStart || date > rangeEnd) continue;
          const code    = wData.daily.weathercode[i];
          const tempMax = Math.round(wData.daily.temperature_2m_max[i]);
          const tempMin = Math.round(wData.daily.temperature_2m_min[i]);
          const precip  = Math.round(wData.daily.precipitation_sum[i] * 10) / 10;
          const wind    = Math.round(wData.daily.windspeed_10m_max[i]);
          const { icon, label } = wmoLabel(code);
          weatherDays.push({
            date,
            tempMax,
            tempMin,
            precipMm: precip,
            wmoCode: code,
            windKmh: wind,
            icon,
            label,
            prognosis: deliveryPrognosis(code, tempMax, precip),
          });
        }
      } catch (err) {
        console.warn("Open-Meteo fetch failed:", err);
      }

      res.json({
        weekRange: { from: rangeStart, to: rangeEnd },
        holidays: holidaysInWeek,
        bayernGames,
        weather: weatherDays,
      });
    } catch (error) {
      console.error("Error fetching upcoming week info:", error);
      res.status(500).json({ message: "Fehler beim Abrufen der Wocheninfos" });
    }
  });

  // Inventory Items routes
  app.get("/api/inventory-items", async (req, res) => {
    const storage = await getStorage();
    const { checklistId } = req.query;
    
    if (checklistId) {
      const items = await storage.getInventoryItemsByChecklist(checklistId as string);
      res.json(items);
    } else {
      const items = await storage.getInventoryItems();
      res.json(items);
    }
  });

  // Get inventory items for a specific checklist
  app.get("/api/inventory-items/checklist/:checklistId", async (req, res) => {
    const storage = await getStorage();
    const items = await storage.getInventoryItemsByChecklist(req.params.checklistId);
    res.json(items);
  });

  app.post("/api/inventory-items", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.json(item);

      // Fire-and-forget: warn if "Kugeln von morgen verwendet" has quantity > 0
      if (validatedData.quantity > 0) {
        const task = await storage.getTaskById(validatedData.taskId).catch(() => undefined);
        if (task && task.title.toLowerCase().includes("kugeln von morgen")) {
          const checklist = await storage.getChecklistById(validatedData.checklistId).catch(() => undefined);
          if (checklist) {
            sendKugelnWarningEmail({
              store: checklist.store,
              quantity: validatedData.quantity,
              employeeName: checklist.employeeName,
            });
          }
        }
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory item data" });
    }
  });

  app.put("/api/inventory-items/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory item data" });
    }
  });

  app.delete("/api/inventory-items/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteInventoryItem(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json({ success: true });
  });

  // Object Storage routes
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put("/api/attachments", async (req, res) => {
    if (!req.body.fileURL) {
      return res.status(400).json({ error: "fileURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.fileURL);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error processing attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


  // Employee Messages routes (from all areas)
  app.get("/api/employee-messages", async (req, res) => {
    const storage = await getStorage();
    const messages = await storage.getEmployeeMessages();
    res.json(messages);
  });

  app.get("/api/employee-messages/:id", async (req, res) => {
    const storage = await getStorage();
    const message = await storage.getEmployeeMessageById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    res.json(message);
  });

  app.post("/api/employee-messages", async (req, res) => {
    try {
      const storage = await getStorage();
      const { insertEmployeeMessageSchema } = await import("@shared/schema");
      const validatedData = insertEmployeeMessageSchema.parse(req.body);
      const message = await storage.createEmployeeMessage(validatedData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.delete("/api/employee-messages/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteEmployeeMessage(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Message not found" });
    }
    res.json({ success: true });
  });

  // Store Whiteboard routes
  app.get("/api/whiteboard/:storeName", async (req, res) => {
    const storage = await getStorage();
    const allNotes = await storage.getWhiteboardNotes(req.params.storeName);
    
    // Filter out expired notes
    const now = new Date();
    const activeNotes = allNotes.filter(note => {
      if (!(note as any).expiresAt) return true;
      return new Date((note as any).expiresAt) > now;
    });
    
    res.json(activeNotes);
  });

  app.post("/api/whiteboard", async (req, res) => {
    try {
      const storage = await getStorage();
      const { insertStoreWhiteboardSchema } = await import("@shared/schema");
      const validatedData = insertStoreWhiteboardSchema.parse(req.body);
      const note = await storage.createWhiteboardNote(validatedData);
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Invalid whiteboard note data" });
    }
  });

  app.patch("/api/whiteboard/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const { message, editorName } = req.body;
      
      if (!message || !editorName) {
        return res.status(400).json({ message: "Message and editor name are required" });
      }
      
      const updatedNote = await storage.updateWhiteboardNote(req.params.id, message, editorName);
      
      if (!updatedNote) {
        return res.status(404).json({ message: "Whiteboard note not found" });
      }
      
      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete("/api/whiteboard/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteWhiteboardNote(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Whiteboard note not found" });
    }
    res.json({ success: true });
  });

  // Image upload route for whiteboard notes
  app.post("/api/upload/whiteboard-image", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // Extract base64 data from data URL
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ message: "Invalid image data format" });
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Determine file extension from MIME type
      let extension = '.jpg';
      if (mimeType.includes('png')) {
        extension = '.png';
      } else if (mimeType.includes('gif')) {
        extension = '.gif';
      } else if (mimeType.includes('webp')) {
        extension = '.webp';
      }
      
      // Generate unique filename
      const filename = `whiteboard-${randomUUID()}${extension}`;
      
      // Upload to object storage
      const privateDir = process.env.PRIVATE_OBJECT_DIR || '/replit-objstore-af34c6fd-ac39-4de6-9454-67f23a144783/.private';
      const fullPath = `${privateDir}/whiteboard/${filename}`;
      
      // Parse the path to get bucket and object name
      const pathParts = fullPath.split('/').filter(p => p);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');
      
      // Use the objectStorageClient directly
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Upload the buffer
      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
        },
      });
      
      // Return the file path for storage in database
      res.json({ imageUrl: fullPath });
    } catch (error) {
      console.error('Error uploading whiteboard image:', error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Get image route for whiteboard notes
  app.get("/api/whiteboard-image", async (req, res) => {
    try {
      const { path: imagePath } = req.query;
      
      if (!imagePath || typeof imagePath !== 'string') {
        return res.status(400).json({ message: "No image path provided" });
      }
      
      // Parse the path to get bucket and object name
      const pathParts = imagePath.split('/').filter(p => p);
      const bucketName = pathParts[0];
      const objectName = pathParts.slice(1).join('/');
      
      // Use the objectStorageClient directly
      const { objectStorageClient } = await import('./objectStorage');
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Download the file
      const [buffer] = await file.download();
      
      // Determine content type from file extension
      let contentType = 'image/jpeg';
      if (imagePath.endsWith('.png')) {
        contentType = 'image/png';
      } else if (imagePath.endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (imagePath.endsWith('.webp')) {
        contentType = 'image/webp';
      }
      
      res.setHeader('Content-Type', contentType);
      res.send(buffer);
      
    } catch (error) {
      console.error('Image download error:', error);
      res.status(404).json({ message: "Image not found" });
    }
  });

  // Whiteboard Reads routes
  app.post("/api/whiteboard-reads", async (req, res) => {
    try {
      // Import the schema for validation
      const { insertWhiteboardReadSchema } = await import("@shared/schema");
      const validatedData = insertWhiteboardReadSchema.parse(req.body);
      
      const storage = await getStorage();
      const whiteboardRead = await storage.createWhiteboardRead(validatedData);
      res.json(whiteboardRead);
    } catch (error: any) {
      console.error('Error creating whiteboard read:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid whiteboard read data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create whiteboard read" });
    }
  });

  app.get("/api/whiteboard-reads/check", async (req, res) => {
    try {
      const { employeeName, store, shift, date } = req.query;
      
      if (!employeeName || !store || !shift || !date) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const storage = await getStorage();
      const hasRead = await storage.checkWhiteboardRead(
        employeeName as string,
        store as string,
        shift as string,
        date as string
      );
      
      res.json({ hasRead });
    } catch (error) {
      console.error('Error checking whiteboard read:', error);
      res.status(500).json({ message: "Failed to check whiteboard read" });
    }
  });

  app.delete("/api/whiteboard-reads/reset", async (req, res) => {
    try {
      const storage = await getStorage();
      await storage.resetWhiteboardReads();
      res.json({ success: true, message: "All whiteboard reads have been reset" });
    } catch (error) {
      console.error('Error resetting whiteboard reads:', error);
      res.status(500).json({ message: "Failed to reset whiteboard reads" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const storage = await getStorage();
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const storage = await getStorage();
      const setting = await storage.getSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      // Validate input
      if (!key || key.trim() === '') {
        return res.status(400).json({ message: "Key is required" });
      }
      
      if (typeof value !== 'boolean') {
        return res.status(400).json({ message: "Value must be a boolean" });
      }

      const storage = await getStorage();
      const setting = await storage.upsertSetting(key, value, description);
      res.json(setting);
    } catch (error) {
      console.error('Error upserting setting:', error);
      res.status(500).json({ message: "Failed to upsert setting" });
    }
  });

  // App Settings (Passwords etc.) routes
  app.get("/api/app-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const storage = await getStorage();
      let setting = await storage.getAppSetting(key);
      
      // If setting doesn't exist, create default values for passwords
      if (!setting && (key === "app_password" || key === "admin_password")) {
        const defaultValue = key === "app_password" ? "0101" : "0001";
        console.log(`Creating default ${key}: ${defaultValue}`);
        setting = await storage.updateAppSetting(key, defaultValue);
      }
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error fetching app setting:', error);
      res.status(500).json({ message: "Failed to fetch app setting" });
    }
  });

  app.put("/api/app-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!key || key.trim() === '') {
        return res.status(400).json({ message: "Key is required" });
      }
      
      if (!value || typeof value !== 'string') {
        return res.status(400).json({ message: "Value is required and must be a string" });
      }

      const storage = await getStorage();
      const setting = await storage.updateAppSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error('Error updating app setting:', error);
      res.status(500).json({ message: "Failed to update app setting" });
    }
  });

  return createServer(app);
}