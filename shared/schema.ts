import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").notNull(),
  useShifts: boolean("use_shifts").notNull().default(true), // true = mit Schichten, false = einfache Checkliste
  categoryType: text("category_type", { enum: ["shifts", "simple", "inventory"] }).notNull().default("shifts"), // Option 1: Mit Schichten, Option 2: Einfache Checkliste, Option 3: Mit Mengenerfassung
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
  lateShiftDate: date("late_shift_date"), // Spätschicht Mengenformular: selected date
  ballsForTomorrow: integer("balls_for_tomorrow"), // Spätschicht: How many balls for tomorrow
  newBalls: integer("new_balls"), // Spätschicht: How many are new
  lunchShiftDate: date("lunch_shift_date"), // Mittagsschicht Mengenformular: selected date
  ballsForToday: integer("balls_for_today"), // Mittagsschicht: How many balls for today
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Teig-Produktions-Template-Tabelle für wiederkehrende Wochentage
export const teigProductionTemplate = pgTable("teig_production_template", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekday: integer("weekday").notNull(), // 0=Sonntag, 1=Montag, ..., 6=Samstag
  store: text("store").notNull(), // JP23, KP5, TS17
  kugelMenge: integer("kugel_menge").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teig-Produktions-Tabelle für aktuelle Woche (wird wöchentlich zurückgesetzt)
export const teigProduction = pgTable("teig_production", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  store: text("store").notNull(), // JP23, KP5, TS17
  kugelMenge: integer("kugel_menge").notNull(),
  fromTemplate: boolean("from_template").notNull().default(true), // Wurde von Template generiert
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertTeigProductionTemplateSchema = createInsertSchema(teigProductionTemplate).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeigProductionSchema = createInsertSchema(teigProduction).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklists.$inferSelect;

export type InsertTeigProductionTemplate = z.infer<typeof insertTeigProductionTemplateSchema>;
export type TeigProductionTemplate = typeof teigProductionTemplate.$inferSelect;

export type InsertTeigProduction = z.infer<typeof insertTeigProductionSchema>;
export type TeigProduction = typeof teigProduction.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;
