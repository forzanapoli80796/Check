import { type Category, type InsertCategory, type Task, type InsertTask, type Checklist, type InsertChecklist, type TeigProduction, type InsertTeigProduction, type InventoryItem, type InsertInventoryItem } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
