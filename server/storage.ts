import {
  users,
  bookmarks,
  categories,
  notes,
  workspaceTabs,
  type User,
  type UpsertUser,
  type Bookmark,
  type InsertBookmark,
  type UpdateBookmark,
  type Category,
  type InsertCategory,
  type UpdateCategory,
  type Note,
  type InsertNote,
  type UpdateNote,
  type WorkspaceTab,
  type InsertWorkspaceTab,
  type UpdateWorkspaceTab,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Workspace tab operations
  getUserWorkspaceTabs(userId: string): Promise<WorkspaceTab[]>;
  getActiveWorkspaceTab(userId: string): Promise<WorkspaceTab | undefined>;
  getWorkspaceTab(id: number, userId: string): Promise<WorkspaceTab | undefined>;
  createWorkspaceTab(tab: InsertWorkspaceTab, userId: string): Promise<WorkspaceTab>;
  updateWorkspaceTab(id: number, tab: Partial<UpdateWorkspaceTab>, userId: string): Promise<WorkspaceTab | undefined>;
  deleteWorkspaceTab(id: number, userId: string): Promise<boolean>;
  setActiveWorkspaceTab(id: number, userId: string): Promise<boolean>;
  
  // Category operations (now tab-specific)
  getTabCategories(tabId: number, userId: string): Promise<Category[]>;
  getUserCategories(userId: string): Promise<Category[]>; // Legacy support
  getCategory(id: number, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory, userId: string, tabId?: number): Promise<Category>;
  updateCategory(id: number, category: Partial<UpdateCategory>, userId: string): Promise<Category | undefined>;
  deleteCategory(id: number, userId: string): Promise<boolean>;
  
  // Bookmark operations (now tab-specific)
  getTabBookmarks(tabId: number, userId: string): Promise<Bookmark[]>;
  getUserBookmarks(userId: string): Promise<Bookmark[]>; // Legacy support
  getBookmark(id: number, userId: string): Promise<Bookmark | undefined>;
  createBookmark(bookmark: InsertBookmark, userId: string, tabId?: number): Promise<Bookmark>;
  updateBookmark(id: number, bookmark: Partial<UpdateBookmark>, userId: string): Promise<Bookmark | undefined>;
  deleteBookmark(id: number, userId: string): Promise<boolean>;
  
  // Note operations (now tab-specific)
  getTabNotes(tabId: number, userId: string): Promise<Note[]>;
  getUserNotes(userId: string): Promise<Note[]>; // Legacy support
  getNote(id: number, userId: string): Promise<Note | undefined>;
  createNote(note: InsertNote, userId: string, tabId?: number): Promise<Note>;
  updateNote(id: number, note: Partial<UpdateNote>, userId: string): Promise<Note | undefined>;
  deleteNote(id: number, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Workspace tab operations
  async getUserWorkspaceTabs(userId: string): Promise<WorkspaceTab[]> {
    try {
      return await db.select().from(workspaceTabs).where(eq(workspaceTabs.userId, userId)).orderBy(workspaceTabs.order);
    } catch (error) {
      // If table doesn't exist yet, return empty array
      return [];
    }
  }

  async getActiveWorkspaceTab(userId: string): Promise<WorkspaceTab | undefined> {
    try {
      const [tab] = await db.select().from(workspaceTabs).where(and(eq(workspaceTabs.userId, userId), eq(workspaceTabs.isActive, true)));
      return tab;
    } catch (error) {
      return undefined;
    }
  }

  async getWorkspaceTab(id: number, userId: string): Promise<WorkspaceTab | undefined> {
    try {
      const [tab] = await db.select().from(workspaceTabs).where(and(eq(workspaceTabs.id, id), eq(workspaceTabs.userId, userId)));
      return tab;
    } catch (error) {
      return undefined;
    }
  }

  async createWorkspaceTab(insertTab: InsertWorkspaceTab, userId: string): Promise<WorkspaceTab> {
    try {
      // Get the next order number
      const existingTabs = await this.getUserWorkspaceTabs(userId);
      const nextOrder = existingTabs.length;

      const [tab] = await db
        .insert(workspaceTabs)
        .values({
          ...insertTab,
          userId,
          order: nextOrder,
          isActive: existingTabs.length === 0, // First tab is active by default
        })
        .returning();
      return tab;
    } catch (error) {
      throw new Error("Failed to create workspace tab");
    }
  }

  async updateWorkspaceTab(id: number, updateData: Partial<UpdateWorkspaceTab>, userId: string): Promise<WorkspaceTab | undefined> {
    try {
      const [tab] = await db
        .update(workspaceTabs)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(workspaceTabs.id, id), eq(workspaceTabs.userId, userId)))
        .returning();
      return tab;
    } catch (error) {
      return undefined;
    }
  }

  async deleteWorkspaceTab(id: number, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(workspaceTabs)
        .where(and(eq(workspaceTabs.id, id), eq(workspaceTabs.userId, userId)));
      return result.rowCount > 0;
    } catch (error) {
      return false;
    }
  }

  async setActiveWorkspaceTab(id: number, userId: string): Promise<boolean> {
    try {
      // First, deactivate all tabs for the user
      await db
        .update(workspaceTabs)
        .set({ isActive: false })
        .where(eq(workspaceTabs.userId, userId));

      // Then activate the specified tab
      const [tab] = await db
        .update(workspaceTabs)
        .set({ isActive: true })
        .where(and(eq(workspaceTabs.id, id), eq(workspaceTabs.userId, userId)))
        .returning();
      
      return !!tab;
    } catch (error) {
      return false;
    }
  }

  // Category operations (now tab-specific)
  async getTabCategories(tabId: number, userId: string): Promise<Category[]> {
    // Will be implemented after schema sync
    return [];
  }

  async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const userCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));
      return userCategories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getCategory(id: number, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return category;
  }

  async createCategory(insertCategory: InsertCategory, userId: string): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({ ...insertCategory, userId })
      .returning();
    return category;
  }

  async updateCategory(id: number, updateData: Partial<UpdateCategory>, userId: string): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return category;
  }

  async deleteCategory(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Bookmark operations
  async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    try {
      return await db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  }

  async getBookmark(id: number, userId: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
    return bookmark;
  }

  async createBookmark(insertBookmark: InsertBookmark, userId: string): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values({ ...insertBookmark, userId })
      .returning();
    return bookmark;
  }

  async updateBookmark(id: number, updateData: Partial<UpdateBookmark>, userId: string): Promise<Bookmark | undefined> {
    const [bookmark] = await db
      .update(bookmarks)
      .set(updateData)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .returning();
    return bookmark;
  }

  async deleteBookmark(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  // Note operations
  async getUserNotes(userId: string): Promise<Note[]> {
    try {
      return await db.select().from(notes).where(eq(notes.userId, userId));
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async getNote(id: number, userId: string): Promise<Note | undefined> {
    const [note] = await db.select().from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return note;
  }

  async createNote(insertNote: InsertNote, userId: string): Promise<Note> {
    const [note] = await db
      .insert(notes)
      .values({ ...insertNote, userId })
      .returning();
    return note;
  }

  async updateNote(id: number, updateData: Partial<UpdateNote>, userId: string): Promise<Note | undefined> {
    const [note] = await db
      .update(notes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return note;
  }

  async deleteNote(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
