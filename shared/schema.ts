import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Local user authentication table
export const localUsers = pgTable("local_users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tabId: integer("tab_id").references(() => workspaceTabs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  backgroundStyle: text("background_style").notNull().default("border"), // "border" or "fill"
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  width: real("width").notNull().default(300),
  height: real("height").notNull().default(200),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tabId: integer("tab_id").references(() => workspaceTabs.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id),
  title: text("title").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull(), // emoji, base64 image data, or text
  iconType: text("icon_type").notNull(), // 'emoji', 'image', or 'text'
  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  isPlaced: integer("is_placed").notNull().default(0), // 0 = false, 1 = true (SQLite boolean)
});

// Workspace tabs for organizing content
export const workspaceTabs = pgTable("workspace_tabs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tabId: integer("tab_id").references(() => workspaceTabs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  x: real("x").notNull().default(100),
  y: real("y").notNull().default(100),
  width: real("width").notNull().default(200),
  height: real("height").notNull().default(150),
  backgroundColor: text("background_color").notNull().default("#fef3c7"),
  textColor: text("text_color").notNull().default("#1f2937"),
  fontSize: integer("font_size").notNull().default(14),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  userId: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Category name is required"),
  color: z.string().default("#3b82f6"),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().min(100).default(300),
  height: z.number().min(100).default(200),
});

export const updateCategorySchema = insertCategorySchema.partial().extend({
  id: z.number(),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type Category = typeof categories.$inferSelect;

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  userId: true,
}).extend({
  categoryId: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  icon: z.string().min(1, "Icon is required"),
  iconType: z.enum(["emoji", "image", "text"]),
  x: z.number().default(0),
  y: z.number().default(0),
  isPlaced: z.number().min(0).max(1).default(0),
});

export const updateBookmarkSchema = insertBookmarkSchema.partial().extend({
  id: z.number(),
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  content: z.string().min(1, "Note content is required"),
  x: z.number().default(100),
  y: z.number().default(100),
  width: z.number().min(100).default(200),
  height: z.number().min(100).default(150),
  backgroundColor: z.string().default("#fef3c7"),
  textColor: z.string().default("#1f2937"),
  fontSize: z.number().min(10).max(24).default(14),
});

export const updateNoteSchema = insertNoteSchema.partial().extend({
  id: z.number(),
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const insertWorkspaceTabSchema = createInsertSchema(workspaceTabs).omit({
  id: true,
  userId: true,
  isActive: true,
  order: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Tab name is required"),
});

export const updateWorkspaceTabSchema = insertWorkspaceTabSchema.partial().extend({
  id: z.number(),
});

export type InsertWorkspaceTab = z.infer<typeof insertWorkspaceTabSchema>;
export type UpdateWorkspaceTab = z.infer<typeof updateWorkspaceTabSchema>;
export type WorkspaceTab = typeof workspaceTabs.$inferSelect;
