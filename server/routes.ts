import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertCategorySchema, insertTaskSchema, insertChecklistSchema, insertTeigProductionSchema, insertInventoryItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Admin verification
  app.post("/api/admin/verify", async (req, res) => {
    const { code } = req.body;
    if (code === "0001") {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid admin code" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    const storage = await getStorage();
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ success: true });
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    const storage = await getStorage();
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const success = await storage.deleteTask(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      if (error.message === 'TASK_IN_USE') {
        return res.status(400).json({ 
          message: "Diese Aufgabe kann nicht gelöscht werden, da sie bereits in Checklists verwendet wird.",
          code: "TASK_IN_USE"
        });
      }
      return res.status(500).json({ 
        message: "Fehler beim Löschen der Aufgabe",
        code: "DATABASE_ERROR"
      });
    }
  });

  // Checklists routes
  app.get("/api/checklists", async (req, res) => {
    const storage = await getStorage();
    const checklists = await storage.getChecklists();
    res.json(checklists);
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertChecklistSchema.parse(req.body);
      const checklist = await storage.createChecklist(validatedData);
      res.json(checklist);
    } catch (error) {
      console.error("Checklist creation error:", error);
      res.status(400).json({ message: "Invalid checklist data" });
    }
  });

  app.delete("/api/checklists/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteChecklist(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Checklist not found" });
    }
    res.json({ success: true });
  });

  // Teig Production routes
  app.get("/api/teig-production", async (req, res) => {
    const storage = await getStorage();
    const { date, startDate, endDate } = req.query;
    
    if (date) {
      const productions = await storage.getTeigProductionByDate(date as string);
      res.json(productions);
    } else if (startDate && endDate) {
      const productions = await storage.getTeigProductionByDateRange(startDate as string, endDate as string);
      res.json(productions);
    } else {
      const productions = await storage.getTeigProduction();
      res.json(productions);
    }
  });

  app.post("/api/teig-production", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertTeigProductionSchema.parse(req.body);
      const production = await storage.createTeigProduction(validatedData);
      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Invalid production data" });
    }
  });

  app.put("/api/teig-production/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertTeigProductionSchema.partial().parse(req.body);
      const production = await storage.updateTeigProduction(req.params.id, validatedData);
      if (!production) {
        return res.status(404).json({ message: "Production record not found" });
      }
      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Invalid production data" });
    }
  });

  app.delete("/api/teig-production/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteTeigProduction(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Production record not found" });
    }
    res.json({ success: true });
  });

  // Inventory Items routes
  app.get("/api/inventory-items", async (req, res) => {
    const storage = await getStorage();
    const { checklistId } = req.query;
    
    if (checklistId) {
      const items = await storage.getInventoryItemsByChecklist(checklistId as string);
      res.json(items);
    } else {
      const items = await storage.getInventoryItems();
      res.json(items);
    }
  });

  app.post("/api/inventory-items", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory item data" });
    }
  });

  app.put("/api/inventory-items/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, validatedData);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid inventory item data" });
    }
  });

  app.delete("/api/inventory-items/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteInventoryItem(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json({ success: true });
  });

  return createServer(app);
}