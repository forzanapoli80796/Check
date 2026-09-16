import test from "node:test";
import assert from "node:assert/strict";

// Keep these tests independent of the application's database and SMTP
// configuration. The imported modules only create clients; no connection or
// mail is made by these unit tests.
process.env.DATABASE_URL = "postgresql://localhost/forza-check-tests";
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;

const {
  MHD_NOTIFICATION_RECIPIENT,
  buildMhdChecklistEmail,
  sendMhdChecklistEmail,
  getEmailNotificationsSettings,
  saveEmailNotificationsSettings,
  DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS,
} = await import("./email.ts");
const { MemStorage, getStorage } = await import("./storage.ts");
const { strictEqual } = assert;

const mhdChecklist = {
  id: "checklist-1",
  categoryId: "mhd-category",
  employeeName: "Test Mitarbeiter",
  store: "JP23",
  shiftType: "keine_schicht",
  completedTasks: ["task-1"],
  images: [],
  taskImages: {},
  taskNotes: {},
  comments: "Alles geprüft",
  mhdExpiryDate: "2025-12-31",
  mhdProductDetails: "Mozzarella und Salami",
  mhdStockCount: "7",
  lateShiftDate: null,
  ballsForTomorrow: null,
  newBalls: null,
  lunchShiftDate: null,
  ballsForToday: null,
  redBags: null,
  blackBags: null,
  drinksBags: null,
  completionDate: null,
  signature: null,
  submittedAt: new Date("2025-01-02T12:34:00.000Z"),
} as any;

test("MHD notification uses the dedicated recipient and includes all submitted values", () => {
  strictEqual(MHD_NOTIFICATION_RECIPIENT, "mhd@forzanapoli.de");

  const { subject, body } = buildMhdChecklistEmail({
    checklist: mhdChecklist,
    category: { name: "MHD-Check" },
    tasks: [{
      id: "task-1",
      categoryId: "mhd-category",
      title: "Wurstwaren geprüft",
    }] as any,
  });

  assert.match(subject, /MHD-Check/);
  assert.match(body, /JP23/);
  assert.match(body, /Test Mitarbeiter/);
  assert.match(body, /Mozzarella und Salami/);
  assert.match(body, /Bestand: 7/);
  assert.match(body, /Wurstwaren geprüft: Ja/);
  assert.match(body, /Alles geprüft/);
});

test("MHD notification is gated by the server-resolved category", async () => {
  const result = await sendMhdChecklistEmail({
    checklist: mhdChecklist,
    category: { name: "Terminal" },
    tasks: [],
  });

  assert.equal(result.sent, false);
  assert.equal(result.skipped, true);
});

test("SMTP failure is reported without sending mail", async () => {
  await saveEmailNotificationsSettings({
    ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS,
    mhdCheck: { enabled: true },
  });

  const result = await sendMhdChecklistEmail({
    checklist: mhdChecklist,
    category: { name: "MHD-Check" },
    tasks: [],
  });

  assert.equal(result.sent, false);
  assert.equal(result.error, "SMTP ist nicht konfiguriert.");
});

test("legacy email settings migrate to an enabled MHD notification", async () => {
  const storage = await getStorage();
  await storage.updateAppSetting("email_notifications_config", JSON.stringify({
    kugelnUsed: DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.kugelnUsed,
    kugelnLeftover: DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.kugelnLeftover,
  }));

  const settings = await getEmailNotificationsSettings();
  strictEqual(settings.mhdCheck.enabled, true);
});

test("MHD notification setting persists without changing other notification settings", async () => {
  const customSubject = "Eigener Betreff";
  await saveEmailNotificationsSettings({
    ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS,
    kugelnUsed: {
      ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.kugelnUsed,
      subject: customSubject,
    },
    mhdCheck: { enabled: false },
  });

  const settings = await getEmailNotificationsSettings();
  strictEqual(settings.mhdCheck.enabled, false);
  strictEqual(settings.kugelnUsed.subject, customSubject);
  strictEqual(settings.kugelnLeftover.enabled, DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS.kugelnLeftover.enabled);
});

test("disabled MHD notification skips sending without a failure", async () => {
  await saveEmailNotificationsSettings({
    ...DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS,
    mhdCheck: { enabled: false },
  });

  const result = await sendMhdChecklistEmail({
    checklist: mhdChecklist,
    category: { name: "MHD-Check" },
    tasks: [],
  });

  assert.equal(result.sent, false);
  assert.equal(result.skipped, true);
  assert.equal(result.error, undefined);

  await saveEmailNotificationsSettings(DEFAULT_EMAIL_NOTIFICATIONS_SETTINGS);
});

test("MHD stock count survives checklist persistence", async () => {
  const storage = new MemStorage();
  const category = (await storage.getCategories()).find(cat => cat.name === "MHD-Check");
  assert.ok(category);

  const checklist = await storage.createChecklist({
    categoryId: category.id,
    employeeName: "Test Mitarbeiter",
    store: "JP23",
    shiftType: "keine_schicht",
    completedTasks: [],
    mhdExpiryDate: "2025-12-31",
    mhdProductDetails: "Mozzarella",
    mhdStockCount: "7",
  });

  strictEqual(checklist.mhdStockCount, "7");
  strictEqual(checklist.mhdExpiryDate, "2025-12-31");
  strictEqual(checklist.mhdProductDetails, "Mozzarella");
});