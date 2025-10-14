import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertCategorySchema, insertTaskSchema, insertChecklistSchema, insertTeigProductionSchema, insertInventoryItemSchema, insertTicketSchema, insertEmployeeNoteSchema } from "@shared/schema";
import { z } from "zod";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

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
  
  app.get("/api/categories/:id", async (req, res) => {
    const storage = await getStorage();
    const categories = await storage.getCategories();
    const category = categories.find(c => c.id === req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });

  app.get("/api/categories/:id/subcategories", async (req, res) => {
    const storage = await getStorage();
    const subcategories = await storage.getSubcategories(req.params.id);
    res.json(subcategories);
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
    
    // Filter by store if provided
    const { store } = req.query;
    if (store && typeof store === 'string') {
      const filteredTasks = tasks.filter(task => 
        task.stores && task.stores.includes(store)
      );
      return res.json(filteredTasks);
    }
    
    res.json(tasks);
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const storage = await getStorage();
      const taskData = {
        ...req.body,
        icon: req.body.icon || "clipboard-list", // Default icon
        estimatedMinutes: String(req.body.estimatedMinutes || 5), // Convert to string
      };
      // Convert old format to new format for backwards compatibility
      if (taskData.shift === 'früh') taskData.shift = 'frühschicht';
      if (taskData.shift === 'spät') taskData.shift = 'spätschicht';
      
      const validatedData = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      // Convert old format to new format for backwards compatibility
      const updateData = { ...req.body };
      if (updateData.shift === 'früh') updateData.shift = 'frühschicht';
      if (updateData.shift === 'spät') updateData.shift = 'spätschicht';
      if (updateData.estimatedMinutes !== undefined) {
        updateData.estimatedMinutes = String(updateData.estimatedMinutes);
      }
      
      const validatedData = insertTaskSchema.partial().parse(updateData);
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
      return res.status(500).json({ 
        message: "Fehler beim Löschen der Aufgabe",
        code: "DATABASE_ERROR"
      });
    }
  });

  // Checklists routes
  app.get("/api/checklists", async (req, res) => {
    const storage = await getStorage();
    let checklists = await storage.getChecklists();
    
    // Filter by store if provided
    const { store, startDate, endDate } = req.query;
    
    if (store && typeof store === 'string' && store !== 'alle') {
      checklists = checklists.filter(checklist => checklist.store === store);
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      checklists = checklists.filter(checklist => {
        if (!checklist.submittedAt) return false;
        const submittedDate = new Date(checklist.submittedAt);
        return submittedDate >= start && submittedDate <= end;
      });
    }
    
    res.json(checklists);
  });

  app.post("/api/checklists", async (req, res) => {
    try {
      const storage = await getStorage();
      
      // Extract special fields before validation
      const { 
        mhdExpiryDate, 
        mhdProductDetails, 
        lateShiftDate,
        ballsForTomorrow,
        newBalls,
        lunchShiftDate,
        ballsForToday,
        completionDate,
        ...baseData 
      } = req.body;
      
      // Validate base checklist data
      const validatedData = insertChecklistSchema.parse(baseData);
      
      // Add special fields if present
      const checklistData: any = {
        ...validatedData,
        mhdExpiryDate: mhdExpiryDate || null,
        mhdProductDetails: mhdProductDetails || null,
        lateShiftDate: lateShiftDate || null,
        ballsForTomorrow: ballsForTomorrow || null,
        newBalls: newBalls || null,
        lunchShiftDate: lunchShiftDate || null,
        ballsForToday: ballsForToday || null,
        completionDate: completionDate || null
      };
      
      const checklist = await storage.createChecklist(checklistData);
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
    const productions = await storage.getTeigProduction();
    res.json(productions);
  });

  app.get("/api/teig-production/:weekday/:store", async (req, res) => {
    const storage = await getStorage();
    const production = await storage.getTeigProductionByWeekdayStore(Number(req.params.weekday), req.params.store);
    if (!production) {
      // Return default if not found
      return res.json({ weekday: Number(req.params.weekday), store: req.params.store, kugelMenge: 0 });
    }
    res.json(production);
  });

  app.put("/api/teig-production", async (req, res) => {
    try {
      const storage = await getStorage();
      const { weekday, store, kugelMenge } = req.body;
      
      if (weekday === undefined || !store || kugelMenge === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const production = await storage.upsertTeigProduction(weekday, store, kugelMenge);
      res.json(production);
    } catch (error) {
      res.status(400).json({ message: "Invalid production data" });
    }
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

  // Get inventory items for a specific checklist
  app.get("/api/inventory-items/checklist/:checklistId", async (req, res) => {
    const storage = await getStorage();
    const items = await storage.getInventoryItemsByChecklist(req.params.checklistId);
    res.json(items);
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

  // Object Storage routes
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put("/api/attachments", async (req, res) => {
    if (!req.body.fileURL) {
      return res.status(400).json({ error: "fileURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.fileURL);

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error processing attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", async (req, res) => {
    const storage = await getStorage();
    const { store, startDate, endDate, categoryId } = req.query;
    
    // Get all tickets first
    let tickets = await storage.getTickets();
    
    // Filter by store if provided
    if (store && typeof store === 'string') {
      tickets = tickets.filter(t => t.store === store);
    }
    
    // Filter by categoryId if provided
    if (categoryId && typeof categoryId === 'string') {
      tickets = tickets.filter(t => t.categoryId === categoryId);
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      tickets = tickets.filter(t => {
        if (!t.createdAt) return false;
        const createdAt = new Date(t.createdAt);
        return createdAt >= start && createdAt <= end;
      });
    }
    
    res.json(tickets);
  });

  app.get("/api/tickets/:id", async (req, res) => {
    const storage = await getStorage();
    const ticket = await storage.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const storage = await getStorage();
      console.log("Received ticket data:", req.body);
      const validatedData = insertTicketSchema.parse(req.body);
      console.log("Validated ticket data:", validatedData);
      const ticket = await storage.createTicket(validatedData);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating ticket - Details:", error);
      console.error("Request body was:", req.body);
      res.status(400).json({ message: "Invalid ticket data", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateTicket(req.params.id, validatedData);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Invalid ticket data" });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteTicket(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json({ success: true });
  });

  app.post("/api/tickets/:id/comments", async (req, res) => {
    try {
      const storage = await getStorage();
      const { user, comment } = req.body;
      
      if (!user || !comment) {
        return res.status(400).json({ message: "User and comment are required" });
      }
      
      const ticket = await storage.addTicketComment(req.params.id, {
        user,
        comment,
        timestamp: new Date(),
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // Employee Notes routes
  app.get("/api/employee-notes", async (req, res) => {
    const storage = await getStorage();
    const notes = await storage.getEmployeeNotes();
    res.json(notes);
  });

  app.get("/api/employee-notes/:id", async (req, res) => {
    const storage = await getStorage();
    const note = await storage.getEmployeeNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json(note);
  });

  app.post("/api/employee-notes", async (req, res) => {
    try {
      const storage = await getStorage();
      const validatedData = insertEmployeeNoteSchema.parse(req.body);
      const note = await storage.createEmployeeNote(validatedData);
      res.json(note);
    } catch (error) {
      res.status(400).json({ message: "Invalid note data" });
    }
  });

  app.delete("/api/employee-notes/:id", async (req, res) => {
    const storage = await getStorage();
    const success = await storage.deleteEmployeeNote(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Note not found" });
    }
    res.json({ success: true });
  });

  return createServer(app);
}