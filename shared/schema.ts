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
  categoryType: text("category_type", { enum: ["shifts", "simple", "inventory"] }).notNull().default("shifts"), // Option 1: Mit Schichten, Option 2: Einfache Checkliste, Option 3: Mit Mengenerfassung
  parentId: varchar("parent_id"), // Parent category ID for subcategories
  isSubcategoryParent: boolean("is_subcategory_parent").notNull().default(false), // true if this category has subcategories
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
  completionDate: date("completion_date"), // Betriebsleiter: When tasks were actually completed
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

// Inventur-Tabelle für Mengenangaben
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checklistId: varchar("checklist_id").references(() => checklists.id).notNull(),
  taskId: varchar("task_id").references(() => tasks.id).notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(), // Stück, Einheit, Karton, Liter, KG
  createdAt: timestamp("created_at").defaultNow(),
});

// Tickets-Tabelle für Kugelfahrer-Hausmeister
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  image: text("image"), // Base64 oder URL des Bildes
  status: text("status", { enum: ["offen", "in_bearbeitung", "erledigt"] }).notNull().default("offen"),
  priority: text("priority", { enum: ["niedrig", "mittel", "hoch"] }).notNull().default("mittel"),
  store: text("store").notNull(), // JP23, KP5, TS17
  dueDate: timestamp("due_date"), // Gewünschtes Erledigungsdatum mit Uhrzeit
  categoryId: varchar("category_id"), // Verknüpfung mit Kugelfahrer-Hausmeister Kategorie
  createdBy: text("created_by").notNull(), // Admin, der das Ticket erstellt hat
  assignedTo: text("assigned_to"), // Kugelfahrer-Hausmeister, dem es zugewiesen ist
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"), // Zeitpunkt der Erledigung
  comments: jsonb("comments").default('[]'), // Array von Kommentaren [{user, comment, timestamp}]
});

// Mitarbeiter-Notizen für Kugelfahrer-Hausmeister
export const employeeNotes = pgTable("employee_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  employeeName: text("employee_name").notNull(),
  store: text("store").notNull(),
  categoryId: varchar("category_id"),
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

export const insertTeigProductionSchema = createInsertSchema(teigProduction).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertEmployeeNoteSchema = createInsertSchema(employeeNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklists.$inferSelect;

export type InsertTeigProduction = z.infer<typeof insertTeigProductionSchema>;
export type TeigProduction = typeof teigProduction.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertEmployeeNote = z.infer<typeof insertEmployeeNoteSchema>;
export type EmployeeNote = typeof employeeNotes.$inferSelect;
