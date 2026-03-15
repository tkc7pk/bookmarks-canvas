import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookmarkSchema, updateBookmarkSchema, insertCategorySchema, updateCategorySchema, insertNoteSchema, updateNoteSchema, insertWorkspaceTabSchema, updateWorkspaceTabSchema, loginSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { verifyLocalUser, createCompatibleUser } from "./localAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Local authentication routes
  app.post('/api/local/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const localUser = await verifyLocalUser(username, password);
      
      if (!localUser) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Create a compatible user object and store in session
      const compatibleUser = createCompatibleUser(localUser);
      const userRecord = await storage.upsertUser({
        id: compatibleUser.claims.sub,
        email: compatibleUser.claims.email,
        firstName: compatibleUser.claims.first_name,
        lastName: compatibleUser.claims.last_name,
        profileImageUrl: compatibleUser.claims.profile_image_url,
      });
      
      // Store user in session
      (req as any).login(compatibleUser, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json(userRecord);
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Local login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/local/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Workspace tab routes
  app.get("/api/workspace-tabs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tabs = await storage.getUserWorkspaceTabs(userId);
      res.json(tabs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workspace tabs" });
    }
  });

  app.post("/api/workspace-tabs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tab = await storage.createWorkspaceTab(req.body, userId);
      res.status(201).json(tab);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workspace tab" });
    }
  });

  app.patch("/api/workspace-tabs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const tab = await storage.updateWorkspaceTab(id, req.body, userId);
      if (!tab) return res.status(404).json({ message: "Tab not found" });
      res.json(tab);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workspace tab" });
    }
  });

  app.delete("/api/workspace-tabs/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const success = await storage.deleteWorkspaceTab(id, userId);
      if (!success) return res.status(404).json({ message: "Tab not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workspace tab" });
    }
  });

  app.post("/api/workspace-tabs/:id/activate", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const success = await storage.setActiveWorkspaceTab(id, userId);
      if (!success) return res.status(404).json({ message: "Tab not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to activate workspace tab" });
    }
  });

  // Category routes
  // Get user's categories
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getUserCategories(userId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Create a new category
  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData, userId);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Update a category
  app.patch("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const updateData = updateCategorySchema.parse({ ...req.body, id });
      const category = await storage.updateCategory(id, updateData, userId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  // Delete a category
  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const success = await storage.deleteCategory(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Get user's bookmarks
  app.get("/api/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarks = await storage.getUserBookmarks(userId);
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Get a specific bookmark
  app.get("/api/bookmarks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bookmark ID" });
      }

      const bookmark = await storage.getBookmark(id, userId);
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      res.json(bookmark);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmark" });
    }
  });

  // Create a new bookmark
  app.post("/api/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertBookmarkSchema.parse(req.body);
      const bookmark = await storage.createBookmark(validatedData, userId);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  // Update a bookmark
  app.patch("/api/bookmarks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bookmark ID" });
      }

      const validatedData = updateBookmarkSchema.parse({ ...req.body, id });
      const bookmark = await storage.updateBookmark(id, validatedData, userId);
      
      if (!bookmark) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      res.json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  // Delete a bookmark
  app.delete("/api/bookmarks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bookmark ID" });
      }

      const success = await storage.deleteBookmark(id, userId);
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Notes routes
  app.get("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notes = await storage.getUserNotes(userId);
      res.json(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  app.get("/api/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const note = await storage.getNote(id, userId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  app.post("/api/notes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const noteData = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(noteData, userId);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const updateData = updateNoteSchema.parse({ ...req.body, id });
      const note = await storage.updateNote(id, updateData, userId);
      
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const success = await storage.deleteNote(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Workspace Tab routes
  app.get('/api/workspace-tabs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tabs = await storage.getUserWorkspaceTabs(userId);
      res.json(tabs);
    } catch (error) {
      console.error("Error fetching workspace tabs:", error);
      res.status(500).json({ message: "Failed to fetch workspace tabs" });
    }
  });

  app.post('/api/workspace-tabs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertWorkspaceTabSchema.parse(req.body);
      const tab = await storage.createWorkspaceTab(validatedData, userId);
      res.status(201).json(tab);
    } catch (error) {
      console.error("Error creating workspace tab:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workspace tab" });
    }
  });

  app.patch('/api/workspace-tabs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const validatedData = updateWorkspaceTabSchema.parse(req.body);
      const tab = await storage.updateWorkspaceTab(id, validatedData, userId);
      
      if (!tab) {
        return res.status(404).json({ message: "Workspace tab not found" });
      }
      
      res.json(tab);
    } catch (error) {
      console.error("Error updating workspace tab:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update workspace tab" });
    }
  });

  app.delete('/api/workspace-tabs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const success = await storage.deleteWorkspaceTab(id, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Workspace tab not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting workspace tab:", error);
      res.status(500).json({ message: "Failed to delete workspace tab" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
