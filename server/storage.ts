import { type Category, type InsertCategory, type Task, type InsertTask, type Checklist, type InsertChecklist, type TeigProduction, type InsertTeigProduction, type InventoryItem, type InsertInventoryItem, type Ticket, type InsertTicket, type EmployeeNote, type InsertEmployeeNote, type EmployeeMessage, type InsertEmployeeMessage, type StoreWhiteboard, type InsertStoreWhiteboard, type WhiteboardRead, type InsertWhiteboardRead, type Setting, type InsertSetting } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { categories, tasks, checklists, teigProduction, inventoryItems, tickets, employeeNotes, employeeMessages, storeWhiteboard, whiteboardReads, settings } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  getSubcategories(parentId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByCategory(categoryId: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Checklists
  getChecklists(): Promise<Checklist[]>;
  getChecklistById(id: string): Promise<Checklist | undefined>;
  getChecklistsByStore(store: string): Promise<Checklist[]>;
  getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  deleteChecklist(id: string): Promise<boolean>;

  // Teig Production
  getTeigProduction(): Promise<TeigProduction[]>;
  getTeigProductionByWeekdayStore(weekday: number, store: string): Promise<TeigProduction | undefined>;
  upsertTeigProduction(weekday: number, store: string, kugelMenge: number): Promise<TeigProduction>;

  // Inventory Items
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByChecklist(checklistId: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  
  // Tickets
  getTickets(): Promise<Ticket[]>;
  getTicketById(id: string): Promise<Ticket | undefined>;
  getTicketsByStore(store: string): Promise<Ticket[]>;
  getTicketsByDateRange(startDate: Date, endDate: Date): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: string, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: string): Promise<boolean>;
  addTicketComment(id: string, comment: { user: string; comment: string; timestamp: Date }): Promise<Ticket | undefined>;
  
  // Employee Notes
  getEmployeeNotes(): Promise<EmployeeNote[]>;
  getEmployeeNoteById(id: string): Promise<EmployeeNote | undefined>;
  createEmployeeNote(note: InsertEmployeeNote): Promise<EmployeeNote>;
  deleteEmployeeNote(id: string): Promise<boolean>;
  
  // Employee Messages (from all areas)
  getEmployeeMessages(): Promise<EmployeeMessage[]>;
  getEmployeeMessageById(id: string): Promise<EmployeeMessage | undefined>;
  createEmployeeMessage(message: InsertEmployeeMessage): Promise<EmployeeMessage>;
  deleteEmployeeMessage(id: string): Promise<boolean>;
  
  // Store Whiteboard
  getWhiteboardNotes(storeName: string): Promise<StoreWhiteboard[]>;
  createWhiteboardNote(note: InsertStoreWhiteboard): Promise<StoreWhiteboard>;
  updateWhiteboardNote(id: string, message: string, editorName: string): Promise<StoreWhiteboard | undefined>;
  deleteWhiteboardNote(id: string): Promise<boolean>;
  
  // Whiteboard Reads
  checkWhiteboardRead(employeeName: string, store: string, shift: string, date: string): Promise<boolean>;
  createWhiteboardRead(read: InsertWhiteboardRead): Promise<WhiteboardRead>;
  
  // Settings
  getSettings(): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  upsertSetting(key: string, value: boolean, description?: string): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    const cats = await db.select().from(categories);
    console.log('Getting categories from DB:', cats.map(c => ({ id: c.id, name: c.name, useShifts: c.useShifts, parentId: c.parentId, enforceReading: c.enforceReading })));
    return cats;
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.parentId, parentId));
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    console.log('Creating category with data:', insertCategory);
    const [category] = await db
      .insert(categories)
      .values({
        ...insertCategory,
        id: randomUUID(),
        createdAt: new Date(),
        categoryType: insertCategory.categoryType || (insertCategory.useShifts ? "shifts" : "simple"),
        parentId: insertCategory.parentId || null,
        isSubcategoryParent: insertCategory.isSubcategoryParent || false,
      })
      .returning();
    
    // If this is a subcategory, automatically mark the parent as having subcategories
    if (category.parentId) {
      await db
        .update(categories)
        .set({ isSubcategoryParent: true })
        .where(eq(categories.id, category.parentId));
    }
    
    console.log('Created category:', category);
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({
        ...updateData,
        parentId: updateData.parentId === undefined ? undefined : updateData.parentId || null,
        isSubcategoryParent: updateData.isSubcategoryParent === undefined ? undefined : updateData.isSubcategoryParent || false,
      })
      .where(eq(categories.id, id))
      .returning();
    
    // If this became a subcategory, mark the parent as having subcategories
    if (category && category.parentId && updateData.parentId !== undefined) {
      await db
        .update(categories)
        .set({ isSubcategoryParent: true })
        .where(eq(categories.id, category.parentId));
    }
    
    // If parentId was removed, check if old parent still has subcategories
    if (category && updateData.parentId === null) {
      // This is now a main category, not checking old parent
    }
    
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      // Get the category to be deleted
      const [categoryToDelete] = await db.select().from(categories).where(eq(categories.id, id));
      const parentId = categoryToDelete?.parentId;
      
      // Check if this category has subcategories
      const subcategories = await db.select().from(categories).where(eq(categories.parentId, id));
      if (subcategories.length > 0) {
        console.error('Cannot delete category with subcategories');
        return false;
      }
      
      // Get all tasks for this category
      const categoryTasks = await db.select().from(tasks).where(eq(tasks.categoryId, id));
      const taskIds = categoryTasks.map(t => t.id);
      
      // Delete inventory items that reference these tasks
      if (taskIds.length > 0) {
        for (const taskId of taskIds) {
          await db.delete(inventoryItems).where(eq(inventoryItems.taskId, taskId));
        }
      }
      
      // Delete all checklists for this category
      await db.delete(checklists).where(eq(checklists.categoryId, id));
      
      // Delete all tasks that reference this category
      await db.delete(tasks).where(eq(tasks.categoryId, id));
      
      // Finally delete the category
      const result = await db.delete(categories).where(eq(categories.id, id));
      
      // If this was a subcategory, check if parent still has other subcategories
      if (parentId && result.rowCount && result.rowCount > 0) {
        const remainingSubcategories = await db.select().from(categories).where(eq(categories.parentId, parentId));
        if (remainingSubcategories.length === 0) {
          // No more subcategories, update parent
          await db
            .update(categories)
            .set({ isSubcategoryParent: false })
            .where(eq(categories.id, parentId));
        }
      }
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTasksByCategory(categoryId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.categoryId, categoryId));
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({
        ...insertTask,
        id: randomUUID(),
        createdAt: new Date(),
        shift: insertTask.shift || "both",
        shiftPhase: insertTask.shiftPhase || "both",
        stores: insertTask.stores || ["JP23", "KP5", "TS17"],
        attachments: insertTask.attachments || null,
      })
      .returning();
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({
        ...updateData,
        shift: updateData.shift || "both",
        shiftPhase: updateData.shiftPhase || "both",
        stores: updateData.stores || ["JP23", "KP5", "TS17"],
        attachments: updateData.attachments || null,
      })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      // Erst alle zugehörigen inventory_items löschen
      await db.delete(inventoryItems).where(eq(inventoryItems.taskId, id));
      
      // Dann die Aufgabe löschen
      const result = await db.delete(tasks).where(eq(tasks.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error: any) {
      console.error('Delete task error:', error);
      throw new Error('DATABASE_ERROR');
    }
  }

  async getChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists);
  }

  async getChecklistById(id: string): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(eq(checklists.id, id));
    return checklist || undefined;
  }

  async getChecklistsByStore(store: string): Promise<Checklist[]> {
    return await db.select().from(checklists).where(eq(checklists.store, store));
  }

  async getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]> {
    return await db.select().from(checklists); // Simplified for now
  }

  async createChecklist(insertChecklist: InsertChecklist): Promise<Checklist> {
    const [checklist] = await db
      .insert(checklists)
      .values({
        ...insertChecklist,
        id: randomUUID(),
        submittedAt: new Date(),
        images: insertChecklist.images || null,
        taskImages: insertChecklist.taskImages || null,
        taskNotes: insertChecklist.taskNotes || null,
        mhdExpiryDate: (insertChecklist as any).mhdExpiryDate || null,
        mhdProductDetails: (insertChecklist as any).mhdProductDetails || null,
        lateShiftDate: (insertChecklist as any).lateShiftDate || null,
        ballsForTomorrow: (insertChecklist as any).ballsForTomorrow || null,
        newBalls: (insertChecklist as any).newBalls || null,
        lunchShiftDate: (insertChecklist as any).lunchShiftDate || null,
        ballsForToday: (insertChecklist as any).ballsForToday || null,
      })
      .returning();
    return checklist;
  }

  async deleteChecklist(id: string): Promise<boolean> {
    // First delete associated inventory items to avoid foreign key constraint violation
    await db.delete(inventoryItems).where(eq(inventoryItems.checklistId, id));
    
    // Then delete the checklist
    const result = await db.delete(checklists).where(eq(checklists.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTeigProduction(): Promise<TeigProduction[]> {
    return await db.select().from(teigProduction);
  }

  async getTeigProductionByWeekdayStore(weekday: number, store: string): Promise<TeigProduction | undefined> {
    const [production] = await db
      .select()
      .from(teigProduction)
      .where(sql`${teigProduction.weekday} = ${weekday} AND ${teigProduction.store} = ${store}`);
    return production || undefined;
  }

  async upsertTeigProduction(weekday: number, store: string, kugelMenge: number): Promise<TeigProduction> {
    // Try to find existing entry
    const existing = await this.getTeigProductionByWeekdayStore(weekday, store);
    
    if (existing) {
      // Update existing
      const [updated] = await db
        .update(teigProduction)
        .set({ kugelMenge, updatedAt: new Date() })
        .where(eq(teigProduction.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(teigProduction)
        .values({
          id: randomUUID(),
          weekday,
          store,
          kugelMenge,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems);
  }

  async getInventoryItemsByChecklist(checklistId: string): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(eq(inventoryItems.checklistId, checklistId));
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventoryItems)
      .values({
        ...insertItem,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, updateData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Ticket methods
  async getTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets).orderBy(sql`${tickets.createdAt} DESC`);
  }

  async getTicketById(id: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async getTicketsByStore(store: string): Promise<Ticket[]> {
    return await db.select().from(tickets).where(eq(tickets.store, store)).orderBy(sql`${tickets.createdAt} DESC`);
  }

  async getTicketsByDateRange(startDate: Date, endDate: Date): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(sql`${tickets.createdAt} >= ${startDate} AND ${tickets.createdAt} < ${endDate}`)
      .orderBy(sql`${tickets.createdAt} DESC`);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...insertTicket,
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: insertTicket.comments || [],
      })
      .returning();
    return ticket;
  }

  async updateTicket(id: string, updateData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    return ticket || undefined;
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addTicketComment(id: string, comment: { user: string; comment: string; timestamp: Date }): Promise<Ticket | undefined> {
    const [existingTicket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!existingTicket) return undefined;
    
    const currentComments = (existingTicket.comments as any[]) || [];
    const updatedComments = [...currentComments, comment];
    
    const [updatedTicket] = await db
      .update(tickets)
      .set({
        comments: updatedComments,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    
    return updatedTicket || undefined;
  }

  // Employee Notes methods
  async getEmployeeNotes(): Promise<EmployeeNote[]> {
    return await db.select().from(employeeNotes).orderBy(sql`${employeeNotes.createdAt} DESC`);
  }

  async getEmployeeNoteById(id: string): Promise<EmployeeNote | undefined> {
    const [note] = await db.select().from(employeeNotes).where(eq(employeeNotes.id, id));
    return note || undefined;
  }

  async createEmployeeNote(insertNote: InsertEmployeeNote): Promise<EmployeeNote> {
    const [note] = await db
      .insert(employeeNotes)
      .values({
        ...insertNote,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return note;
  }

  async deleteEmployeeNote(id: string): Promise<boolean> {
    const result = await db.delete(employeeNotes).where(eq(employeeNotes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Employee Messages methods
  async getEmployeeMessages(): Promise<EmployeeMessage[]> {
    return await db.select().from(employeeMessages).orderBy(sql`${employeeMessages.createdAt} DESC`);
  }

  async getEmployeeMessageById(id: string): Promise<EmployeeMessage | undefined> {
    const [message] = await db.select().from(employeeMessages).where(eq(employeeMessages.id, id));
    return message || undefined;
  }

  async createEmployeeMessage(insertMessage: InsertEmployeeMessage): Promise<EmployeeMessage> {
    const [message] = await db
      .insert(employeeMessages)
      .values({
        ...insertMessage,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return message;
  }

  async deleteEmployeeMessage(id: string): Promise<boolean> {
    const result = await db.delete(employeeMessages).where(eq(employeeMessages.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Store Whiteboard methods
  async getWhiteboardNotes(storeName: string): Promise<StoreWhiteboard[]> {
    return await db.select().from(storeWhiteboard)
      .where(eq(storeWhiteboard.storeName, storeName))
      .orderBy(sql`${storeWhiteboard.createdAt} DESC`);
  }

  async createWhiteboardNote(insertNote: InsertStoreWhiteboard): Promise<StoreWhiteboard> {
    const [note] = await db
      .insert(storeWhiteboard)
      .values({
        ...insertNote,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return note;
  }

  async updateWhiteboardNote(id: string, message: string, editorName: string): Promise<StoreWhiteboard | undefined> {
    const note = await db.select().from(storeWhiteboard).where(eq(storeWhiteboard.id, id)).limit(1);
    
    if (note.length === 0) return undefined;
    
    const currentNote = note[0];
    const editedBy = (currentNote.editedBy as any[]) || [];
    editedBy.push({ name: editorName, editedAt: new Date() });
    
    const [updated] = await db
      .update(storeWhiteboard)
      .set({
        message,
        editedBy,
        lastEditedAt: new Date(),
      })
      .where(eq(storeWhiteboard.id, id))
      .returning();
    
    return updated;
  }

  async deleteWhiteboardNote(id: string): Promise<boolean> {
    const result = await db.delete(storeWhiteboard).where(eq(storeWhiteboard.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Whiteboard Reads methods
  async checkWhiteboardRead(employeeName: string, store: string, shift: string, date: string): Promise<boolean> {
    const result = await db.select().from(whiteboardReads)
      .where(
        and(
          eq(whiteboardReads.employeeName, employeeName),
          eq(whiteboardReads.store, store),
          eq(whiteboardReads.shift, shift),
          eq(whiteboardReads.date, date)
        )
      )
      .limit(1);
    
    return result.length > 0;
  }

  async createWhiteboardRead(read: InsertWhiteboardRead): Promise<WhiteboardRead> {
    const [whiteboardRead] = await db
      .insert(whiteboardReads)
      .values({
        ...read,
        id: randomUUID(),
        readAt: new Date(),
      })
      .returning();
    return whiteboardRead;
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }

  async getSettingByKey(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async upsertSetting(key: string, value: boolean, description?: string): Promise<Setting> {
    const existing = await this.getSettingByKey(key);
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values({
          id: randomUUID(),
          key,
          value,
          description: description || null,
          updatedAt: new Date(),
        })
        .returning();
      return created;
    }
  }
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private tasks: Map<string, Task> = new Map();
  private checklists: Map<string, Checklist> = new Map();
  private teigProductions: Map<string, TeigProduction> = new Map();
  private inventoryItems: Map<string, InventoryItem> = new Map();
  private tickets: Map<string, Ticket> = new Map();
  private employeeNotes: Map<string, EmployeeNote> = new Map();
  private employeeMessages: Map<string, EmployeeMessage> = new Map();
  private whiteboardNotes: Map<string, StoreWhiteboard> = new Map();
  private whiteboardReadRecords: Map<string, WhiteboardRead> = new Map();
  private settingsMap: Map<string, Setting> = new Map();

  constructor() {
    this.initializeDefaultData();
    
    // Warnung für Production Environment
    if (process.env.REPLIT_DEPLOYMENT) {
      console.warn('⚠️  WARNING: Using MemStorage in Production - Data will not persist between deployments!');
      console.warn('📝 Consider using PostgreSQL or Replit Database for production deployments.');
    }
  }

  private initializeDefaultData() {
    const categoryIds: Record<string, string> = {};
    
    // Initialize main categories first
    const mainCategories = [
      { name: "Terminal", description: "Kassensystem & Kundenbereich", icon: "desktop", useShifts: true, categoryType: "shifts" as const, isSubcategoryParent: false },
      { name: "Küche", description: "Zubereitung & Hygiene", icon: "utensils", useShifts: true, categoryType: "shifts" as const, isSubcategoryParent: true },
      { name: "Fahrer", description: "Fahrzeug & Lieferung", icon: "car", useShifts: true, categoryType: "shifts" as const, isSubcategoryParent: false },
      { name: "Inventur", description: "Bestandsaufnahme", icon: "clipboard-list", useShifts: false, categoryType: "inventory" as const, isSubcategoryParent: false },
      { name: "Sonderreinigung", description: "Tiefenreinigung", icon: "broom", useShifts: false, categoryType: "simple" as const, isSubcategoryParent: false },
      { name: "Betriebsleiter", description: "Management & Organisation", icon: "briefcase", useShifts: false, categoryType: "simple" as const, isSubcategoryParent: false },
      { name: "Kugelfahrer-Hausmeister", description: "Wartung & Reparaturen", icon: "wrench", useShifts: false, categoryType: "simple" as const, isSubcategoryParent: false },
    ];
    
    // Create main categories
    mainCategories.forEach(cat => {
      const id = randomUUID();
      const category: Category = {
        id,
        ...cat,
        iconColor: null,
        parentId: null,
        enforceReading: false,
        createdAt: new Date(),
      };
      this.categories.set(id, category);
      categoryIds[cat.name] = id;
    });
    
    // Now create subcategories for Küche
    const kucheId = categoryIds["Küche"];
    const kucheSubcategories = [
      { name: "Küche Checkliste", description: "Standard Küchen-Checkliste", icon: "utensils", useShifts: true, categoryType: "shifts" as const },
      { name: "MHD-Check", description: "Mindesthaltbarkeitsdatum überprüfen", icon: "calendar-check", useShifts: false, categoryType: "simple" as const },
      { name: "Mengenformular Spätschicht", description: "Teigmengen für Spätschicht", icon: "calculator", useShifts: false, categoryType: "simple" as const },
      { name: "Mengenformular Mittagsschicht", description: "Teigmengen für Mittagsschicht", icon: "clipboard-check", useShifts: false, categoryType: "simple" as const },
    ];
    
    kucheSubcategories.forEach(cat => {
      const id = randomUUID();
      const category: Category = {
        id,
        ...cat,
        iconColor: null,
        parentId: kucheId,
        isSubcategoryParent: false,
        enforceReading: false,
        createdAt: new Date(),
      };
      this.categories.set(id, category);
      categoryIds[cat.name] = id;
    });

    // Initialize default tasks for each category
    const defaultTasks = [
      // Terminal tasks
      { categoryName: "Terminal", title: "Kassensystem überprüfen", description: "Kasse einschalten und Funktion testen", icon: "desktop", priority: "high" as const },
      { categoryName: "Terminal", title: "Kundenbereich reinigen", description: "Theke und Wartebereich säubern", icon: "spray-can", priority: "medium" as const },
      { categoryName: "Terminal", title: "Wechselgeld prüfen", description: "Kassenschublade auffüllen", icon: "coins", priority: "high" as const },
      
      // Küche Checkliste tasks
      { categoryName: "Küche Checkliste", title: "Küchengeräte reinigen", description: "Alle Geräte gründlich säubern", icon: "utensils", priority: "high" as const },
      { categoryName: "Küche Checkliste", title: "Temperatur kontrollieren", description: "Kühl- und Gefriergeräte prüfen", icon: "thermometer", priority: "high" as const },
      { categoryName: "Küche Checkliste", title: "Arbeitsflächen desinfizieren", description: "Alle Oberflächen mit Desinfektionsmittel reinigen", icon: "spray-can", priority: "high" as const },
      
      // MHD-Check tasks
      { categoryName: "MHD-Check", title: "Alle Wurstwaren auf MHD überprüft", description: "Alte Ware vorne, neue Ware hinten", icon: "clipboard-check", priority: "high" as const },
      { categoryName: "MHD-Check", title: "Alle Käseprodukte auf MHD überprüft", description: "Alte Ware vorne, neue Ware hinten", icon: "clipboard-check", priority: "high" as const },
      { categoryName: "MHD-Check", title: "Käse vegan auf MHD überprüft", description: "Alte Ware vorne, neue Ware hinten", icon: "clipboard-check", priority: "high" as const },
      
      // Fahrer tasks  
      { categoryName: "Fahrer", title: "Fahrzeug checken", description: "Lichter, Bremsen und Reifen prüfen", icon: "car", priority: "high" as const },
      { categoryName: "Fahrer", title: "Liefertaschen kontrollieren", description: "Thermotaschen auf Sauberkeit prüfen", icon: "shopping-cart", priority: "medium" as const },
      
      // Inventur tasks
      { categoryName: "Inventur", title: "Warenbestand zählen", description: "Alle Artikel erfassen und dokumentieren", icon: "barcode", priority: "medium" as const },
      { categoryName: "Inventur", title: "Gewichte kontrollieren", description: "Waagen kalibrieren und prüfen", icon: "weight", priority: "medium" as const },
      
      // Sonderreinigung tasks
      { categoryName: "Sonderreinigung", title: "Tiefenreinigung durchführen", description: "Gründliche Reinigung aller Bereiche", icon: "broom", priority: "medium" as const },
      { categoryName: "Sonderreinigung", title: "Desinfektionsprotokoll", description: "Vollständige Desinfektion nach Hygieneplan", icon: "spray-can", priority: "high" as const },
      
      // Betriebsleiter tasks
      { categoryName: "Betriebsleiter", title: "Personalplanung prüfen", description: "Schichtpläne kontrollieren und anpassen", icon: "users", priority: "high" as const },
      { categoryName: "Betriebsleiter", title: "Tagesabrechnung", description: "Kassenabrechnungen und Berichte erstellen", icon: "coins", priority: "high" as const },
      
      // Mengenformular Spätschicht tasks
      { categoryName: "Mengenformular Spätschicht", title: "Kugelmengen erfasst", description: "Anzahl der Teigkugeln für morgen gezählt", icon: "clipboard-list", priority: "high" as const },
      { categoryName: "Mengenformular Spätschicht", title: "Neue Kugeln dokumentiert", description: "Anzahl der neuen Kugeln notiert", icon: "calculator", priority: "high" as const },
      
      // Mengenformular Mittagsschicht tasks
      { categoryName: "Mengenformular Mittagsschicht", title: "Kugelmengen für heute erfasst", description: "Anzahl der Teigkugeln für heute gezählt", icon: "clipboard-check", priority: "high" as const },
    ];

    defaultTasks.forEach(taskData => {
      const categoryId = categoryIds[taskData.categoryName];
      if (categoryId) {
        const id = randomUUID();
        const task: Task = {
          id,
          title: taskData.title,
          description: taskData.description,
          icon: taskData.icon,
          priority: taskData.priority,
          categoryId,
          estimatedMinutes: null,
          shift: "both",
          shiftPhase: "both",
          stores: ["JP23", "KP5", "TS17"],
          attachments: null,
          createdAt: new Date(),
        };
        this.tasks.set(id, task);
      }
    });
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getSubcategories(parentId: string): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.parentId === parentId);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      id,
      description: insertCategory.description || null,
      iconColor: insertCategory.iconColor || null,
      useShifts: insertCategory.useShifts ?? true,
      categoryType: insertCategory.categoryType || (insertCategory.useShifts ? "shifts" : "simple"),
      parentId: insertCategory.parentId || null,
      isSubcategoryParent: insertCategory.isSubcategoryParent || false,
      enforceReading: insertCategory.enforceReading ?? false,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory = { ...category, ...updateData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByCategory(categoryId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.categoryId === categoryId);
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      ...insertTask,
      id,
      description: insertTask.description || null,
      estimatedMinutes: insertTask.estimatedMinutes || null,
      priority: insertTask.priority || "medium",
      shift: insertTask.shift || "both",
      shiftPhase: insertTask.shiftPhase || "both",
      stores: insertTask.stores || ["JP23", "KP5", "TS17"],
      attachments: insertTask.attachments || null,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updateData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Checklist methods
  async getChecklists(): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).sort((a, b) => 
      new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime()
    );
  }

  async getChecklistById(id: string): Promise<Checklist | undefined> {
    return this.checklists.get(id);
  }

  async getChecklistsByStore(store: string): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(checklist => checklist.store === store);
  }

  async getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(checklist => {
      const submittedDate = new Date(checklist.submittedAt!);
      return submittedDate >= startDate && submittedDate <= endDate;
    });
  }

  async createChecklist(insertChecklist: InsertChecklist): Promise<Checklist> {
    const id = randomUUID();
    const checklist: Checklist = {
      ...insertChecklist,
      id,
      completedTasks: insertChecklist.completedTasks || [],
      images: insertChecklist.images || [],
      taskImages: insertChecklist.taskImages || {},
      taskNotes: insertChecklist.taskNotes || {},
      comments: insertChecklist.comments || null,
      mhdExpiryDate: insertChecklist.mhdExpiryDate || null,
      mhdProductDetails: insertChecklist.mhdProductDetails || null,
      lateShiftDate: insertChecklist.lateShiftDate || null,
      ballsForTomorrow: insertChecklist.ballsForTomorrow || null,
      newBalls: insertChecklist.newBalls || null,
      lunchShiftDate: insertChecklist.lunchShiftDate || null,
      ballsForToday: insertChecklist.ballsForToday || null,
      completionDate: insertChecklist.completionDate || null,
      submittedAt: new Date(),
    };
    this.checklists.set(id, checklist);
    return checklist;
  }

  async deleteChecklist(id: string): Promise<boolean> {
    return this.checklists.delete(id);
  }

  // Teig Production methods
  async getTeigProduction(): Promise<TeigProduction[]> {
    return Array.from(this.teigProductions.values());
  }

  async getTeigProductionByWeekdayStore(weekday: number, store: string): Promise<TeigProduction | undefined> {
    const key = `${weekday}-${store}`;
    return this.teigProductions.get(key);
  }

  async upsertTeigProduction(weekday: number, store: string, kugelMenge: number): Promise<TeigProduction> {
    const key = `${weekday}-${store}`;
    const existing = this.teigProductions.get(key);
    
    const production: TeigProduction = {
      id: existing?.id || randomUUID(),
      weekday,
      store,
      kugelMenge,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    this.teigProductions.set(key, production);
    return production;
  }

  // Inventory Items methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getInventoryItemsByChecklist(checklistId: string): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => 
      item.checklistId === checklistId
    );
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = randomUUID();
    const item: InventoryItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updateData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updateData };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Ticket methods
  async getTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTicketById(id: string): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketsByStore(store: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.store === store)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getTicketsByDateRange(startDate: Date, endDate: Date): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => {
        const ticketDate = new Date(ticket.createdAt!);
        return ticketDate >= startDate && ticketDate < endDate;
      })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = randomUUID();
    const ticket: Ticket = {
      ...insertTicket,
      id,
      categoryId: insertTicket.categoryId || null,
      status: insertTicket.status || "offen",
      priority: insertTicket.priority || "mittel",
      assignedTo: insertTicket.assignedTo || null,
      image: insertTicket.image || null,
      dueDate: insertTicket.dueDate || null,
      comments: insertTicket.comments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: string, updateData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updatedTicket: Ticket = {
      ...ticket,
      ...updateData,
      updatedAt: new Date(),
      completedAt: updateData.status === "erledigt" ? new Date() : ticket.completedAt,
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: string): Promise<boolean> {
    return this.tickets.delete(id);
  }

  async addTicketComment(id: string, comment: { user: string; comment: string; timestamp: Date }): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const currentComments = (ticket.comments as any[]) || [];
    const updatedTicket: Ticket = {
      ...ticket,
      comments: [...currentComments, comment],
      updatedAt: new Date(),
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  // Employee Notes methods
  async getEmployeeNotes(): Promise<EmployeeNote[]> {
    return Array.from(this.employeeNotes.values()).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getEmployeeNoteById(id: string): Promise<EmployeeNote | undefined> {
    return this.employeeNotes.get(id);
  }

  async createEmployeeNote(insertNote: InsertEmployeeNote): Promise<EmployeeNote> {
    const id = randomUUID();
    const note: EmployeeNote = {
      ...insertNote,
      id,
      categoryId: insertNote.categoryId || null,
      imageUrl: insertNote.imageUrl || null,
      createdAt: new Date(),
    };
    this.employeeNotes.set(id, note);
    return note;
  }

  async deleteEmployeeNote(id: string): Promise<boolean> {
    return this.employeeNotes.delete(id);
  }

  // Employee Messages methods
  async getEmployeeMessages(): Promise<EmployeeMessage[]> {
    return Array.from(this.employeeMessages.values()).sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getEmployeeMessageById(id: string): Promise<EmployeeMessage | undefined> {
    return this.employeeMessages.get(id);
  }

  async createEmployeeMessage(insertMessage: InsertEmployeeMessage): Promise<EmployeeMessage> {
    const id = randomUUID();
    const message: EmployeeMessage = {
      ...insertMessage,
      id,
      imageUrl: insertMessage.imageUrl || null,
      categoryName: insertMessage.categoryName || null,
      createdAt: new Date(),
    };
    this.employeeMessages.set(id, message);
    return message;
  }

  async deleteEmployeeMessage(id: string): Promise<boolean> {
    return this.employeeMessages.delete(id);
  }

  // Store Whiteboard methods
  async getWhiteboardNotes(storeName: string): Promise<StoreWhiteboard[]> {
    return Array.from(this.whiteboardNotes.values())
      .filter(note => note.storeName === storeName)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createWhiteboardNote(insertNote: InsertStoreWhiteboard): Promise<StoreWhiteboard> {
    const id = randomUUID();
    const note: StoreWhiteboard = {
      ...insertNote,
      id,
      color: insertNote.color || null,
      imageUrl: insertNote.imageUrl || null,
      expiresAt: insertNote.expiresAt || null,
      editedBy: [],
      lastEditedAt: null,
      createdAt: new Date(),
    };
    this.whiteboardNotes.set(id, note);
    return note;
  }

  async updateWhiteboardNote(id: string, message: string, editorName: string): Promise<StoreWhiteboard | undefined> {
    const note = this.whiteboardNotes.get(id);
    if (!note) return undefined;
    
    const editedBy = (note.editedBy as any[]) || [];
    editedBy.push({ name: editorName, editedAt: new Date() });
    
    const updatedNote: StoreWhiteboard = {
      ...note,
      message,
      editedBy,
      lastEditedAt: new Date(),
    };
    
    this.whiteboardNotes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteWhiteboardNote(id: string): Promise<boolean> {
    return this.whiteboardNotes.delete(id);
  }

  // Whiteboard Reads methods
  async checkWhiteboardRead(employeeName: string, store: string, shift: string, date: string): Promise<boolean> {
    const key = `${employeeName}-${store}-${shift}-${date}`;
    return this.whiteboardReadRecords.has(key);
  }

  async createWhiteboardRead(read: InsertWhiteboardRead): Promise<WhiteboardRead> {
    const id = randomUUID();
    const whiteboardRead: WhiteboardRead = {
      ...read,
      id,
      readAt: new Date(),
    };
    const key = `${read.employeeName}-${read.store}-${read.shift}-${read.date}`;
    this.whiteboardReadRecords.set(key, whiteboardRead);
    return whiteboardRead;
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settingsMap.values());
  }

  async getSettingByKey(key: string): Promise<Setting | undefined> {
    return this.settingsMap.get(key);
  }

  async upsertSetting(key: string, value: boolean, description?: string): Promise<Setting> {
    const existing = this.settingsMap.get(key);
    
    if (existing) {
      const updated: Setting = {
        ...existing,
        value,
        description: description || existing.description,
        updatedAt: new Date(),
      };
      this.settingsMap.set(key, updated);
      return updated;
    } else {
      const id = randomUUID();
      const created: Setting = {
        id,
        key,
        value,
        description: description || null,
        updatedAt: new Date(),
      };
      this.settingsMap.set(key, created);
      return created;
    }
  }
}

// Automatisches Switching zwischen Database und Memory Storage
async function initializeStorage(): Promise<IStorage> {
  try {
    // Versuche Database-Verbindung
    const dbStorage = new DatabaseStorage();
    
    // Teste die Verbindung
    await dbStorage.getCategories();
    
    console.log('✅ Database connection successful - using PostgreSQL');
    
    // Initialisiere Standard-Daten falls leer
    const existingCategories = await dbStorage.getCategories();
    if (existingCategories.length === 0) {
      console.log('📝 Initializing default data in database...');
      await initializeDefaultData(dbStorage);
    }
    
    return dbStorage;
  } catch (error) {
    console.warn('⚠️  Database connection failed, falling back to MemStorage');
    console.warn('Error:', error);
    return new MemStorage();
  }
}

// Standard-Daten für Database initialisieren
async function initializeDefaultData(storage: DatabaseStorage) {
  const defaultCategories = [
    { name: "Terminal", description: "Kassensystem & Kundenbereich", icon: "desktop" },
    { name: "Küche", description: "Zubereitung & Hygiene", icon: "utensils" },
    { name: "Fahrer", description: "Fahrzeug & Lieferung", icon: "car" },
    { name: "Inventur", description: "Bestandsaufnahme", icon: "clipboard-list" },
    { name: "Sonderreinigung", description: "Tiefenreinigung", icon: "broom" },
    { name: "Betriebsleiter", description: "Management & Organisation", icon: "briefcase" },
    { name: "Kugelfahrer-Hausmeister", description: "Wartung & Reparaturen", icon: "wrench" },
  ];

  const createdCategories: Record<string, string> = {};
  
  for (const cat of defaultCategories) {
    const category = await storage.createCategory(cat);
    createdCategories[cat.name] = category.id;
  }

  const defaultTasks = [
    // Terminal tasks
    { categoryName: "Terminal", title: "Kassensystem überprüfen", description: "Kasse einschalten und Funktion testen", icon: "desktop", priority: "high" as const },
    { categoryName: "Terminal", title: "Kundenbereich reinigen", description: "Theke und Wartebereich säubern", icon: "spray-can", priority: "medium" as const },
    { categoryName: "Terminal", title: "Wechselgeld prüfen", description: "Kassenschublade auffüllen", icon: "coins", priority: "high" as const },
    
    // Küche tasks
    { categoryName: "Küche", title: "Küchengeräte reinigen", description: "Alle Geräte gründlich säubern", icon: "utensils", priority: "high" as const },
    { categoryName: "Küche", title: "Temperatur kontrollieren", description: "Kühl- und Gefriergeräte prüfen", icon: "thermometer", priority: "high" as const },
    { categoryName: "Küche", title: "Arbeitsflächen desinfizieren", description: "Alle Oberflächen mit Desinfektionsmittel reinigen", icon: "spray-can", priority: "high" as const },
    
    // Fahrer tasks  
    { categoryName: "Fahrer", title: "Fahrzeug checken", description: "Lichter, Bremsen und Reifen prüfen", icon: "car", priority: "high" as const },
    { categoryName: "Fahrer", title: "Liefertaschen kontrollieren", description: "Thermotaschen auf Sauberkeit prüfen", icon: "shopping-cart", priority: "medium" as const },
    
    // Inventur tasks
    { categoryName: "Inventur", title: "Warenbestand zählen", description: "Alle Artikel erfassen und dokumentieren", icon: "barcode", priority: "medium" as const },
    { categoryName: "Inventur", title: "Gewichte kontrollieren", description: "Waagen kalibrieren und prüfen", icon: "weight", priority: "medium" as const },
    
    // Sonderreinigung tasks
    { categoryName: "Sonderreinigung", title: "Tiefenreinigung durchführen", description: "Gründliche Reinigung aller Bereiche", icon: "broom", priority: "medium" as const },
    { categoryName: "Sonderreinigung", title: "Desinfektionsprotokoll", description: "Vollständige Desinfektion nach Hygieneplan", icon: "spray-can", priority: "high" as const },
    
    // Betriebsleiter tasks
    { categoryName: "Betriebsleiter", title: "Personalplanung prüfen", description: "Schichtpläne kontrollieren und anpassen", icon: "users", priority: "high" as const },
    { categoryName: "Betriebsleiter", title: "Tagesabrechnung", description: "Kassenabrechnungen und Berichte erstellen", icon: "coins", priority: "high" as const },
  ];

  for (const taskData of defaultTasks) {
    const categoryId = createdCategories[taskData.categoryName];
    if (categoryId) {
      await storage.createTask({
        title: taskData.title,
        description: taskData.description,
        icon: taskData.icon,
        priority: taskData.priority,
        categoryId,
      });
    }
  }
}

let storageInstance: IStorage | null = null;

export const getStorage = async (): Promise<IStorage> => {
  if (!storageInstance) {
    storageInstance = await initializeStorage();
  }
  return storageInstance;
};
