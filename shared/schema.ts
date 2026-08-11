import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  iconColor: text("icon_color").default("#000000"), // Icon color in hex format
  useShifts: boolean("use_shifts").notNull().default(true), // true = mit Schichten, false = einfache Checkliste
  categoryType: text("category_type", { enum: ["shifts", "simple", "inventory", "whiteboard"] }).notNull().default("shifts"), // Option 1: Mit Schichten, Option 2: Einfache Checkliste, Option 3: Mit Mengenerfassung, Option 4: Digitales Whiteboard
  parentId: varchar("parent_id"), // Parent category ID for subcategories
  isSubcategoryParent: boolean("is_subcategory_parent").notNull().default(false), // true if this category has subcategories
  enforceReading: boolean("enforce_reading").notNull().default(false), // For whiteboard categories: true = employees must read and confirm once per shift
  excludedShiftCombos: text("excluded_shift_combos").array().default(sql`ARRAY[]::text[]`), // Shift combos to exclude, e.g. ['frühschicht_schichtende', 'spätschicht_schichtanfang']
  earlyShiftOnly: boolean("early_shift_only").notNull().default(false), // true = nur Frühschicht sieht diese Kategorie
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  estimatedMinutes: text("estimated_minutes").default("5"),
  shift: text("shift", { enum: ["frühschicht", "spätschicht", "both"] }).notNull().default("both"),
  shiftPhase: text("shift_phase", { enum: ["schichtanfang", "schichtende", "both"] }).notNull().default("both"),
  stores: text("stores").array().default(sql`ARRAY['JP23', 'KP5', 'TS17']::text[]`), // Array of store codes this task applies to
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => categories.id).notNull(),
  employeeName: text("employee_name").notNull(),
  store: text("store").notNull(),
  shiftType: text("shift_type").notNull(),
  completedTasks: jsonb("completed_tasks").notNull().default('[]'), // array of task IDs
  images: jsonb("images").default('[]'), // array of image URLs/base64 data for Betriebsleiter
  taskImages: jsonb("task_images").default('{}'), // object mapping taskId to array of images
  taskNotes: jsonb("task_notes").default('{}'), // object mapping taskId to text notes
  comments: text("comments"), // General comments from employee at the end of checklist
  mhdExpiryDate: date("mhd_expiry_date"), // MHD-Check specific: earliest expiry date
  mhdProductDetails: text("mhd_product_details"), // MHD-Check specific: product details
  mhdStockCount: text("mhd_stock_count"), // MHD-Check specific: how much is in stock
  lateShiftDate: date("late_shift_date"), // Spätschicht Mengenformular: selected date
  ballsForTomorrow: integer("balls_for_tomorrow"), // Spätschicht: How many balls for tomorrow
  newBalls: integer("new_balls"), // Spätschicht: How many are new
  lunchShiftDate: date("lunch_shift_date"), // Mittagsschicht Mengenformular: selected date
  ballsForToday: integer("balls_for_today"), // Mittagsschicht: How many balls for today
  redBags: integer("red_bags"), // Liefertaschen zählen: Pizza rote Taschen
  blackBags: integer("black_bags"), // Liefertaschen zählen: Pizza schwarze Taschen
  drinksBags: integer("drinks_bags"), // Liefertaschen zählen: Getränke/Dessert Taschen
  completionDate: date("completion_date"), // Betriebsleiter: When tasks were actually completed
  signature: text("signature"), // Digital signature as base64 PNG (touch devices only)
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Teig-Produktions-Tabelle für Wochentage (Montag-Sonntag)
export const teigProduction = pgTable("teig_production", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekday: integer("weekday").notNull(), // 1=Montag, 2=Dienstag, ..., 7=Sonntag
  store: text("store").notNull(), // JP23, KP5, TS17
  kugelMenge: integer("kugel_menge").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teig-Produktions-Archiv: historische Werte pro KW/Jahr
export const teigProductionHistory = pgTable("teig_production_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kw: integer("kw").notNull(),
  year: integer("year").notNull(),
  weekday: integer("weekday").notNull(),
  store: text("store").notNull(),
  kugelMenge: integer("kugel_menge").notNull(),
  savedAt: timestamp("saved_at").defaultNow(),
});

// Inventur-Tabelle für Mengenangaben
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checklistId: varchar("checklist_id").references(() => checklists.id).notNull(),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // Stück, Einheit, Karton, Liter, KG
  createdAt: timestamp("created_at").defaultNow(),
});

// Mitarbeiter-Nachrichten an Admin (von allen Bereichen)
export const employeeMessages = pgTable("employee_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  employeeName: text("employee_name").notNull(),
  storeName: text("store_name").notNull(),
  categoryName: text("category_name"), // Optional: Bereich, aus dem die Nachricht kommt
  imageUrl: text("image_url"), // Optional: Bild-URL aus Object Storage
  createdAt: timestamp("created_at").defaultNow(), // Automatischer Zeitstempel
});

// App-Einstellungen - Passwörter und andere Konfigurationen
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(), // z.B. "app_password", "admin_password"
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store Whiteboard - Digitales Whiteboard für jeden Store
export const storeWhiteboard = pgTable("store_whiteboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storeName: text("store_name").notNull(), // JP23, KP5, TS17
  message: text("message").notNull(),
  employeeName: text("employee_name").notNull(),
  entryType: text("entry_type").default("info"), // "task" für Aufgaben, "info" für Informationen
  color: text("color").default("yellow"), // Farbe wird automatisch vergeben
  imageUrl: text("image_url"), // Optional: URL zum hochgeladenen Bild
  editedBy: jsonb("edited_by").default('[]'), // Array von Bearbeitern [{name, editedAt}]
  lastEditedAt: timestamp("last_edited_at"), // Zeitstempel der letzten Bearbeitung
  isAdminNote: boolean("is_admin_note").default(false), // Admin-Infos: rot, nur Admin kann löschen/bearbeiten
  createdAt: timestamp("created_at").defaultNow(),
});

// Whiteboard Reads - Tracking wer wann das Whiteboard gelesen hat
export const whiteboardReads = pgTable("whiteboard_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeName: text("employee_name").notNull(),
  store: text("store").notNull(), // JP23, KP5, TS17
  shift: text("shift"), // Optional: nur für Kategorien mit useShifts=true
  date: date("date").notNull(), // Datum der Lesebestätigung
  readAt: timestamp("read_at").defaultNow(),
});

// Terminal Quiz Fragen
export const terminalQuizQuestions = pgTable("terminal_quiz_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer1: text("answer1").notNull(),
  answer2: text("answer2").notNull(),
  answer3: text("answer3").notNull(),
  correctAnswer: integer("correct_answer").notNull(), // 1, 2 oder 3
  isActive: boolean("is_active").notNull().default(true),
  timesShown: integer("times_shown").notNull().default(0), // Wie oft die Frage angezeigt wurde
  answer1Count: integer("answer1_count").notNull().default(0), // Wie oft Antwort 1 angeklickt wurde
  answer2Count: integer("answer2_count").notNull().default(0),
  answer3Count: integer("answer3_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings - System-weite Einstellungen
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // Eindeutiger Schlüssel für die Einstellung
  value: boolean("value").notNull().default(false), // Wert der Einstellung
  description: text("description"), // Beschreibung der Einstellung
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistSchema = createInsertSchema(checklists).omit({
  id: true,
  submittedAt: true,
});

export const insertTeigProductionSchema = createInsertSchema(teigProduction).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeMessageSchema = createInsertSchema(employeeMessages).omit({
  id: true,
  createdAt: true,
});

export const insertStoreWhiteboardSchema = createInsertSchema(storeWhiteboard).omit({
  id: true,
  createdAt: true,
});

export const insertWhiteboardReadSchema = createInsertSchema(whiteboardReads).omit({
  id: true,
  readAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklists.$inferSelect;

export type InsertTeigProduction = z.infer<typeof insertTeigProductionSchema>;
export type TeigProduction = typeof teigProduction.$inferSelect;

export type TeigProductionHistory = typeof teigProductionHistory.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertEmployeeMessage = z.infer<typeof insertEmployeeMessageSchema>;
export type EmployeeMessage = typeof employeeMessages.$inferSelect;

export type InsertStoreWhiteboard = z.infer<typeof insertStoreWhiteboardSchema>;
export type StoreWhiteboard = typeof storeWhiteboard.$inferSelect;

export type InsertWhiteboardRead = z.infer<typeof insertWhiteboardReadSchema>;
export type WhiteboardRead = typeof whiteboardReads.$inferSelect;

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;

export const insertTerminalQuizQuestionSchema = createInsertSchema(terminalQuizQuestions).omit({
  id: true,
  createdAt: true,
  timesShown: true,
  answer1Count: true,
  answer2Count: true,
  answer3Count: true,
});
export type InsertTerminalQuizQuestion = z.infer<typeof insertTerminalQuizQuestionSchema>;
export type TerminalQuizQuestion = typeof terminalQuizQuestions.$inferSelect;
