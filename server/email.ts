import nodemailer from "nodemailer";
import { getStorage } from "./storage";

const NOTIFICATION_RECIPIENT = "bestellung@forzanapoli.de";
const EMAIL_SETTINGS_KEY = "email_notifications_config";

export interface EmailNotificationConfig {
  enabled: boolean;
  subject: string;
  body: string;
  storeEnabled?: Record<string, boolean>;
}

const ALL_STORES = ["JP23", "KP5", "TS17"];

function isStoreEnabled(config: EmailNotificationConfig, store: string): boolean {
  if (!config.storeEnabled) return true;
  return config.storeEnabled[store] !== false;
}

export interface EmailNotificationsSettings {
  kugelnUsed: EmailNotificationConfig;
  kugelnLeftover: EmailNotificationConfig;
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

async function dispatchEmail(subject: string, body: string, logLabel: string) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(
      `[E-Mail] SMTP nicht konfiguriert (SMTP_USER / SMTP_PASS fehlen). E-Mail würde gesendet werden (${logLabel}):\n` +
        body
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Forza Check" <${process.env.SMTP_USER}>`,
      to: NOTIFICATION_RECIPIENT,
      subject,
      text: body,
    });
    console.log(`[E-Mail] ${logLabel} erfolgreich gesendet`);
  } catch (err) {
    console.error(`[E-Mail] Fehler beim Senden (${logLabel}):`, err);
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
