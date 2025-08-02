import { type Category, type InsertCategory, type Task, type InsertTask, type Checklist, type InsertChecklist, type TeigProduction, type InsertTeigProduction, type InventoryItem, type InsertInventoryItem } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { categories, tasks, checklists, teigProduction, inventoryItems } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
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
  getTeigProductionByDate(date: string): Promise<TeigProduction[]>;
  getTeigProductionByDateRange(startDate: string, endDate: string): Promise<TeigProduction[]>;
  createTeigProduction(production: InsertTeigProduction): Promise<TeigProduction>;
  updateTeigProduction(id: string, production: Partial<InsertTeigProduction>): Promise<TeigProduction | undefined>;
  deleteTeigProduction(id: string): Promise<boolean>;

  // Inventory Items
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemsByChecklist(checklistId: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({
        ...insertCategory,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
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
      })
      .returning();
    return task;
  }

  async updateTask(id: string, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updateData)
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
      })
      .returning();
    return checklist;
  }

  async deleteChecklist(id: string): Promise<boolean> {
    const result = await db.delete(checklists).where(eq(checklists.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTeigProduction(): Promise<TeigProduction[]> {
    return await db.select().from(teigProduction);
  }

  async getTeigProductionByDate(date: string): Promise<TeigProduction[]> {
    return await db.select().from(teigProduction).where(eq(teigProduction.date, date));
  }

  async getTeigProductionByDateRange(startDate: string, endDate: string): Promise<TeigProduction[]> {
    return await db.select().from(teigProduction); // Simplified for now
  }

  async createTeigProduction(insertProduction: InsertTeigProduction): Promise<TeigProduction> {
    const [production] = await db
      .insert(teigProduction)
      .values({
        ...insertProduction,
        id: randomUUID(),
        createdAt: new Date(),
      })
      .returning();
    return production;
  }

  async updateTeigProduction(id: string, updateData: Partial<InsertTeigProduction>): Promise<TeigProduction | undefined> {
    const [production] = await db
      .update(teigProduction)
      .set(updateData)
      .where(eq(teigProduction.id, id))
      .returning();
    return production || undefined;
  }

  async deleteTeigProduction(id: string): Promise<boolean> {
    const result = await db.delete(teigProduction).where(eq(teigProduction.id, id));
    return (result.rowCount || 0) > 0;
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
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private tasks: Map<string, Task> = new Map();
  private checklists: Map<string, Checklist> = new Map();
  private teigProductions: Map<string, TeigProduction> = new Map();
  private inventoryItems: Map<string, InventoryItem> = new Map();

  constructor() {
    this.initializeDefaultData();
    
    // Warnung für Production Environment
    if (process.env.REPLIT_DEPLOYMENT) {
      console.warn('⚠️  WARNING: Using MemStorage in Production - Data will not persist between deployments!');
      console.warn('📝 Consider using PostgreSQL or Replit Database for production deployments.');
    }
  }

  private initializeDefaultData() {
    // Initialize default categories
    const defaultCategories = [
      { name: "Terminal", description: "Kassensystem & Kundenbereich", icon: "desktop" },
      { name: "Küche", description: "Zubereitung & Hygiene", icon: "utensils" },
      { name: "Fahrer", description: "Fahrzeug & Lieferung", icon: "car" },
      { name: "Inventur", description: "Bestandsaufnahme", icon: "clipboard-list" },
      { name: "Sonderreinigung", description: "Tiefenreinigung", icon: "broom" },
      { name: "Betriebsleiter", description: "Management & Organisation", icon: "briefcase" },
    ];

    const categoryIds: Record<string, string> = {};
    
    defaultCategories.forEach(cat => {
      const id = randomUUID();
      const category: Category = {
        id,
        ...cat,
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

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      id,
      description: insertCategory.description || null,
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
    return Array.from(this.teigProductions.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getTeigProductionByDate(date: string): Promise<TeigProduction[]> {
    return Array.from(this.teigProductions.values()).filter(production => 
      production.date === date
    );
  }

  async getTeigProductionByDateRange(startDate: string, endDate: string): Promise<TeigProduction[]> {
    return Array.from(this.teigProductions.values()).filter(production => {
      const productionDate = production.date;
      return productionDate >= startDate && productionDate <= endDate;
    });
  }

  async createTeigProduction(insertProduction: InsertTeigProduction): Promise<TeigProduction> {
    const id = randomUUID();
    const production: TeigProduction = {
      ...insertProduction,
      id,
      createdAt: new Date(),
    };
    this.teigProductions.set(id, production);
    return production;
  }

  async updateTeigProduction(id: string, updateData: Partial<InsertTeigProduction>): Promise<TeigProduction | undefined> {
    const production = this.teigProductions.get(id);
    if (!production) return undefined;

    const updatedProduction = { ...production, ...updateData };
    this.teigProductions.set(id, updatedProduction);
    return updatedProduction;
  }

  async deleteTeigProduction(id: string): Promise<boolean> {
    return this.teigProductions.delete(id);
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
