import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 10 }).notNull(), // 'income' or 'expense'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  note: text("note"),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  type: varchar("type", { length: 10 }).notNull(), // 'income' or 'expense'
  icon: varchar("icon", { length: 50 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }),  // optional - can be for specific category
  period: varchar("period", { length: 20 }).notNull(), // 'monthly', 'weekly', 'daily'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: varchar("is_active", { length: 10 }).notNull().default('true'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// User schema (keeping existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
