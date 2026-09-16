import nodemailer from "nodemailer";
import { getStorage } from "./storage";
import type { Category, Checklist, Task } from "@shared/schema";

export const NOTIFICATION_RECIPIENT = "bestellung@forzanapoli.de";
export const MHD_NOTIFICATION_RECIPIENT = "mhd@forzanapoli.de";
const EMAIL_SETTINGS_KEY = "email_notifications_config";

export interface EmailNotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
  storeEnabled?: Record<string, boolean>;
}

export interface MhdNotificationConfig {
  enabled: boolean;
}

const ALL_STORES = ["JP23", "KP5", "TS17"];

export interface EmailSendResult {
  sent: boolean;
  error?: string;
  skipped?: boolean;
}

function isStoreEnabled(config: EmailNotificationConfig, store: string): boolean {
  if (!config.storeEnabled) return true;
  return config.storeEnabled[store] !== false;
}

export interface EmailNotificationsSettings {
  kugelnUsed: EmailNotificationConfig;
  kugelnLeftover: EmailNotificationConfig;
  mhdCheck: MhdNotificationConfig;
}

export const DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS: EmailNotificationsSettings = {
  kugelnUsed: {
    enabled: true,
    subject: "⚠️ Kugeln von morgen verwendet – {{store}}",
    body: `Achtung!

{{store}} hat heute, am {{date}}, bereits {{quantity}} Kugeln für morgen verwendet. Bitte leite eine Nachproduktion ein und veranlasse die Nachlieferung.

Erfasst von: {{employeeName}}

Dein Forza Check`,
  },
  kugelnLeftover: {
    enabled: true,
    subject: "⚠️ Wenige Kugeln übrig ({{leftover}}) – {{store}}",
    body: `Achtung!

{{store}} hat heute, am {{date}}, nur noch {{leftover}} Kugeln übrig. Das liegt unter dem Mindestwert von {{threshold}}. Bitte prüfe die Situation und leite bei Bedarf eine Nachproduktion ein.

Erfasst von: {{employeeName}}

Dein Forza Check`,
    storeEnabled: { JP23: true, KP5: true, TS17: true },
  },
  // MHD notifications have always been sent. Keep the default enabled so
  // existing installations continue delivering them after this setting was
  // added.
  mhdCheck: {
    enabled: true,
  },
};

function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    return key in vars ? String(vars[key]) : `{{${key}}}`;
  });
}

export async function getEmailNotificationsSettings(): Promise<EmailNotificationsSettings> {
  try {
    const storage = await getStorage();
    const setting = await storage.getAppSetting(EMAIL_SETTINGS_KEY);
    if (!setting) return DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS;
    const parsed = JSON.parse(setting.settingValue);
    return {
      kugelnUsed: { ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.kugelnUsed, ...(parsed.kugelnUsed || {}) },
      kugelnLeftover: { ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.kugelnLeftover, ...(parsed.kugelnLeftover || {}) },
      // Older saved JSON does not contain mhdCheck. Merging with the default
      // is the migration path and preserves the historic always-on behavior.
      mhdCheck: { ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.mhdCheck, ...(parsed.mhdCheck || {}) },
    };
  } catch (err) {
    console.error("[E-Mail] Fehler beim Laden der Benachrichtigungseinstellungen, verwende Standardwerte:", err);
    return DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS;
  }
}

export async function saveEmailNotificationsSettings(settings: EmailNotificationsSettings): Promise<void> {
  const storage = await getStorage();
  await storage.updateAppSetting(EMAIL_SETTINGS_KEY, JSON.stringify(settings));
}

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function dispatchEmail(
  subject: string,
  body: string,
  logLabel: string,
  recipient: string = NOTIFICATION_RECIPIENT,
): Promise<EmailSendResult> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      `[E-Mail] SMTP nicht konfiguriert (SMTP_USER / SMTP_PASS fehlen). E-Mail würde gesendet werden (${logLabel}):\n` +
        body
    );
    return { sent: false, error: "SMTP ist nicht konfiguriert." };
  }

  try {
    await transporter.sendMail({
      from: `"Forza Check" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject,
      text: body,
    });
    console.log(`[E-Mail] ${logLabel} erfolgreich gesendet`);
    return { sent: true };
  } catch (err) {
    console.error(`[E-Mail] Fehler beim Senden (${logLabel}):`, err);
    return { sent: false, error: "E-Mail konnte nicht versendet werden." };
  }
}

function todayDe(): string {
  return new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function sendKugelnWarningEmail(params: {
  store: string;
  quantity: number;
  employeeName: string;
  forceSend?: boolean;
}) {
  const { store, quantity, employeeName, forceSend } = params;
  const settings = await getEmailNotificationsSettings();
  const config = settings.kugelnUsed;

  if (!config.enabled && !forceSend) {
    console.log(`[E-Mail] Benachrichtigung "Kugeln von morgen verwendet" ist deaktiviert – kein Versand für ${store}.`);
    return;
  }

  const vars = { store, quantity, employeeName, date: todayDe() };
  const subject = renderTemplate(config.subject, vars);
  const body = renderTemplate(config.body, vars);
  await dispatchEmail(subject, body, `Warn-E-Mail (Kugeln verwendet) für Store ${store}`);
}

export async function sendKugelnLeftoverWarningEmail(params: {
  store: string;
  leftover: number;
  employeeName: string;
  threshold?: number;
  forceSend?: boolean;
}) {
  const { store, leftover, employeeName, threshold = 30, forceSend } = params;
  const settings = await getEmailNotificationsSettings();
  const config = settings.kugelnLeftover;

  if (!config.enabled && !forceSend) {
    console.log(`[E-Mail] Benachrichtigung "Wenige Kugeln übrig" ist deaktiviert – kein Versand für ${store}.`);
    return;
  }

  if (!isStoreEnabled(config, store) && !forceSend) {
    console.log(`[E-Mail] Benachrichtigung "Wenige Kugeln übrig" ist für Store ${store} deaktiviert – kein Versand.`);
    return;
  }

  const vars = { store, leftover, employeeName, date: todayDe(), threshold };
  const subject = renderTemplate(config.subject, vars);
  const body = renderTemplate(config.body, vars);
  await dispatchEmail(subject, body, `Leftover-Warn-E-Mail für Store ${store}`);
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Nicht angegeben";
  }
  return String(value);
}

function formatSubmissionDate(value: Date | string | null | undefined): string {
  if (!value) return "Nicht angegeben";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return displayValue(value);
  return date.toLocaleString("de-DE");
}

/**
 * Builds the MHD notification separately from dispatching it so the complete
 * submitted data can be tested without creating a transporter or sending mail.
 */
export function buildMhdChecklistEmail(params: {
  checklist: Checklist;
  category: Pick<Category, "name">;
  tasks: Task[];
}): { subject: string; body: string } {
  const { checklist, category, tasks } = params;
  const completedTaskIds = new Set(
    Array.isArray(checklist.completedTasks)
      ? checklist.completedTasks.map(taskId => String(taskId))
      : [],
  );
  const taskLines = tasks
    .filter(task => task.categoryId === checklist.categoryId)
    .map(task => {
      const answer = completedTaskIds.has(task.id) ? "Ja" : "Nein";
      const note = checklist.taskNotes &&
        typeof checklist.taskNotes === "object" &&
        !Array.isArray(checklist.taskNotes)
        ? (checklist.taskNotes as Record<string, string>)[task.id]
        : undefined;
      return `- ${task.title}: ${answer}${note ? ` (Notiz: ${note})` : ""}`;
    });

  // Keep answers visible even if an old checklist references tasks that have
  // since been removed from the category.
  const knownTaskIds = new Set(
    tasks.filter(task => task.categoryId === checklist.categoryId).map(task => task.id),
  );
  for (const taskId of Array.from(completedTaskIds)) {
    if (!knownTaskIds.has(taskId)) {
      taskLines.push(`- Aufgabe ${taskId}: Ja`);
    }
  }

  const subject = `MHD-Check – ${displayValue(checklist.store)} – ${displayValue(checklist.employeeName)}`;
  const body = [
    "MHD-Check eingereicht",
    "",
    `Bereich: ${displayValue(category.name)}`,
    `Store: ${displayValue(checklist.store)}`,
    `Mitarbeiter: ${displayValue(checklist.employeeName)}`,
    `Eingereicht am: ${formatSubmissionDate(checklist.submittedAt)}`,
    `Checklisten-ID: ${displayValue(checklist.id)}`,
    "",
    "MHD-Daten:",
    `- Frühestes MHD / Ablaufdatum: ${displayValue(checklist.mhdExpiryDate)}`,
    `- Produkte: ${displayValue(checklist.mhdProductDetails)}`,
    `- Bestand: ${displayValue(checklist.mhdStockCount)}`,
    "",
    "Checklisten-Antworten:",
    ...(taskLines.length > 0 ? taskLines : ["- Keine Aufgaben übermittelt"]),
    ...(checklist.comments ? ["", `Kommentare: ${checklist.comments}`] : []),
    "",
    "Dein Forza Check",
  ].join("\n");

  return { subject, body };
}

export async function sendMhdChecklistEmail(params: {
  checklist: Checklist;
  category: Pick<Category, "name">;
  tasks: Task[];
}): Promise<EmailSendResult> {
  if (params.category.name !== "MHD-Check") {
    return {
      sent: false,
      skipped: true,
      error: "Keine MHD-Check-Kategorie.",
    };
  }

  const settings = await getEmailNotificationsSettings();
  if (settings.mhdCheck.enabled === false) {
    console.log(
      `[E-Mail] MHD-Check-Benachrichtigung ist deaktiviert – kein Versand für ${params.checklist.store}.`,
    );
    return {
      sent: false,
      skipped: true,
    };
  }

  const { subject, body } = buildMhdChecklistEmail(params);
  return dispatchEmail(
    subject,
    body,
    `MHD-Check für Store ${params.checklist.store}`,
    MHD_NOTIFICATION_RECIPIENT,
  );
}
