import { type Category, type InsertCategory, type Task, type InsertTask, type Checklist, type InsertChecklist, type TeigProduction, type InsertTeigProduction } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private tasks: Map<string, Task> = new Map();
  private checklists: Map<string, Checklist> = new Map();
  private teigProductions: Map<string, TeigProduction> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default categories
    const defaultCategories = [
      { name: "Terminal", description: "Kassensystem & Kundenbereich", icon: "desktop" },
      { name: "Küche", description: "Zubereitung & Hygiene", icon: "utensils" },
      { name: "Fahrer", description: "Fahrzeug & Lieferung", icon: "car" },
      { name: "Inventur", description: "Bestandsaufnahme", icon: "clipboard-list" },
      { name: "Sonderreinigung", description: "Tiefenreinigung", icon: "broom" },
    ];

    defaultCategories.forEach(cat => {
      const id = randomUUID();
      const category: Category = {
        id,
        ...cat,
        createdAt: new Date(),
      };
      this.categories.set(id, category);
    });

    // Initialize default tasks for Terminal
    const terminalCategory = Array.from(this.categories.values()).find(c => c.name === "Terminal");
    if (terminalCategory) {
      const defaultTerminalTasks = [
        { title: "Kassensystem überprüfen", description: "Funktionalität aller Kassen kontrollieren", icon: "desktop", priority: "high", estimatedMinutes: "5" },
        { title: "Bondrucker testen", description: "Alle Bondrucker auf Funktionalität prüfen", icon: "print", priority: "high", estimatedMinutes: "3" },
        { title: "Arbeitsplatz reinigen", description: "Terminal-Bereich säubern und desinfizieren", icon: "spray-can", priority: "medium", estimatedMinutes: "10" },
        { title: "Wechselgeld überprüfen", description: "Kassenladen auf ausreichend Wechselgeld kontrollieren", icon: "coins", priority: "high", estimatedMinutes: "5" },
        { title: "Scanner kalibrieren", description: "Barcode-Scanner auf korrekte Funktion testen", icon: "barcode", priority: "medium", estimatedMinutes: "5" },
        { title: "Waage überprüfen", description: "Funktionalität der Kundenwaage kontrollieren", icon: "weight", priority: "medium", estimatedMinutes: "3" },
        { title: "Einkaufswagen zurückstellen", description: "Alle Einkaufswagen ordentlich positionieren", icon: "shopping-cart", priority: "low", estimatedMinutes: "5" },
        { title: "Kundenbereich kontrollieren", description: "Wartebereich und Eingänge überprüfen", icon: "users", priority: "medium", estimatedMinutes: "5" },
      ];

      defaultTerminalTasks.forEach(task => {
        const id = randomUUID();
        const taskObj: Task = {
          id,
          categoryId: terminalCategory.id,
          ...task,
          description: task.description || null,
          estimatedMinutes: task.estimatedMinutes || null,
          createdAt: new Date(),
        };
        this.tasks.set(id, taskObj);
      });
    }

    // Initialize default tasks for other categories
    const categories = Array.from(this.categories.values());
    
    // Küche tasks
    const kucheCategory = categories.find(c => c.name === "Küche");
    if (kucheCategory) {
      const kucheTasks = [
        { title: "Arbeitsflächen desinfizieren", description: "Alle Arbeitsflächen gründlich reinigen und desinfizieren", icon: "spray-can", priority: "high", estimatedMinutes: "15" },
        { title: "Kühlschranktemperatur prüfen", description: "Temperaturen aller Kühlgeräte kontrollieren", icon: "thermometer", priority: "high", estimatedMinutes: "5" },
        { title: "Fritteuse reinigen", description: "Fritteuse säubern und Öl prüfen", icon: "fire", priority: "medium", estimatedMinutes: "20" },
      ];

      kucheTasks.forEach(task => {
        const id = randomUUID();
        const taskObj: Task = {
          id,
          categoryId: kucheCategory.id,
          ...task,
          description: task.description || null,
          estimatedMinutes: task.estimatedMinutes || null,
          createdAt: new Date(),
        };
        this.tasks.set(id, taskObj);
      });
    }

    // Fahrer tasks
    const fahrerCategory = categories.find(c => c.name === "Fahrer");
    if (fahrerCategory) {
      const fahrerTasks = [
        { title: "Fahrzeug überprüfen", description: "Fahrzeugzustand, Kraftstoff und Sauberkeit kontrollieren", icon: "car", priority: "medium", estimatedMinutes: "10" },
        { title: "Lieferroute planen", description: "Optimale Route für Lieferungen festlegen", icon: "map", priority: "medium", estimatedMinutes: "5" },
      ];

      fahrerTasks.forEach(task => {
        const id = randomUUID();
        const taskObj: Task = {
          id,
          categoryId: fahrerCategory.id,
          ...task,
          description: task.description || null,
          estimatedMinutes: task.estimatedMinutes || null,
          createdAt: new Date(),
        };
        this.tasks.set(id, taskObj);
      });
    }
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
}

export const storage = new MemStorage();
