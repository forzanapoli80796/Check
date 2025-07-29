import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertTaskSchema, insertChecklistSchema, insertTeigProductionSchema } from "@shared/schema";
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
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
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
    const success = await storage.deleteCategory(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json({ success: true });
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    const { categoryId } = req.query;
    if (categoryId) {
      const tasks = await storage.getTasksByCategory(categoryId as string);
      res.json(tasks);
    } else {
      const tasks = await storage.getTasks();
      res.json(tasks);
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
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
    const success = await storage.deleteTask(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ success: true });
  });

  // Checklists routes
  app.get("/api/checklists", async (req, res) => {
    const { store, startDate, endDate } = req.query;
    
    let checklists;
    if (store) {
      checklists = await storage.getChecklistsByStore(store as string);
    } else if (startDate && endDate) {
      checklists = await storage.getChecklistsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      checklists = await storage.getChecklists();
    }
    
    res.json(checklists);
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      console.log("Received checklist data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertChecklistSchema.parse(req.body);
      const checklist = await storage.createChecklist(validatedData);
      res.json(checklist);
    } catch (error) {
      console.error("Checklist validation error:", error);
      console.error("Request body:", req.body);
      res.status(400).json({ message: "Invalid checklist data", error: error.message });
    }
  });

  app.delete("/api/checklists/:id", async (req, res) => {
    const success = await storage.deleteChecklist(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Checklist not found" });
    }
    res.json({ success: true });
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    const checklists = await storage.getChecklists();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayChecklists = checklists.filter(c => {
      const submittedDate = new Date(c.submittedAt!);
      return submittedDate >= today && submittedDate < tomorrow;
    });

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekChecklists = checklists.filter(c => {
      const submittedDate = new Date(c.submittedAt!);
      return submittedDate >= weekStart;
    });

    const tasks = await storage.getTasks();
    const categories = await storage.getCategories();

    res.json({
      todayCompleted: todayChecklists.length,
      weekCompleted: weekChecklists.length,
      activeTasks: tasks.length,
      activeCategories: categories.length,
      completionRate: checklists.length > 0 ? Math.round((todayChecklists.length / checklists.length) * 100) : 0,
      pendingTasks: 0, // This would be calculated based on ongoing checklists
    });
  });

  // Teig Production routes
  app.get("/api/teig-production", async (req, res) => {
    const { date, startDate, endDate } = req.query;
    
    try {
      let productions;
      if (date) {
        productions = await storage.getTeigProductionByDate(date as string);
      } else if (startDate && endDate) {
        productions = await storage.getTeigProductionByDateRange(startDate as string, endDate as string);
      } else {
        productions = await storage.getTeigProduction();
      }
      res.json(productions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teig production data" });
    }
  });

  app.post("/api/teig-production", async (req, res) => {
    try {
      const validatedData = insertTeigProductionSchema.parse(req.body);
      const production = await storage.createTeigProduction(validatedData);
      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Invalid teig production data" });
    }
  });

  app.put("/api/teig-production/:id", async (req, res) => {
    try {
      const validatedData = insertTeigProductionSchema.partial().parse(req.body);
      const production = await storage.updateTeigProduction(req.params.id, validatedData);
      if (!production) {
        return res.status(404).json({ message: "Teig production not found" });
      }
      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Invalid teig production data" });
    }
  });

  app.delete("/api/teig-production/:id", async (req, res) => {
    const success = await storage.deleteTeigProduction(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Teig production not found" });
    }
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
