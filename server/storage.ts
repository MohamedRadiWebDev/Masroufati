import { type User, type InsertUser, type Transaction, type InsertTransaction, type Category, type InsertCategory, type Goal, type InsertGoal } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Goal methods
  getGoals(): Promise<Goal[]>;
  getGoal(id: string): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: string): Promise<boolean>;
  getActiveGoals(): Promise<Goal[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private categories: Map<string, Category>;
  private goals: Map<string, Goal>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.categories = new Map();
    this.goals = new Map();
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories: Category[] = [
      // Expense categories
      { id: randomUUID(), name: 'food', nameAr: 'أكل وشرب', type: 'expense', icon: 'fas fa-utensils', color: 'warning' },
      { id: randomUUID(), name: 'transport', nameAr: 'مواصلات', type: 'expense', icon: 'fas fa-car', color: 'primary' },
      { id: randomUUID(), name: 'bills', nameAr: 'فواتير', type: 'expense', icon: 'fas fa-file-invoice', color: 'secondary' },
      { id: randomUUID(), name: 'shopping', nameAr: 'تسوق', type: 'expense', icon: 'fas fa-shopping-bag', color: 'destructive' },
      { id: randomUUID(), name: 'entertainment', nameAr: 'ترفيه', type: 'expense', icon: 'fas fa-gamepad', color: 'accent' },
      { id: randomUUID(), name: 'health', nameAr: 'صحة', type: 'expense', icon: 'fas fa-heart', color: 'success' },
      { id: randomUUID(), name: 'other', nameAr: 'أخرى', type: 'expense', icon: 'fas fa-circle', color: 'muted' },
      
      // Income categories
      { id: randomUUID(), name: 'salary', nameAr: 'راتب', type: 'income', icon: 'fas fa-briefcase', color: 'success' },
      { id: randomUUID(), name: 'freelance', nameAr: 'عمل حر', type: 'income', icon: 'fas fa-laptop', color: 'primary' },
      { id: randomUUID(), name: 'business', nameAr: 'تجارة', type: 'income', icon: 'fas fa-store', color: 'secondary' },
      { id: randomUUID(), name: 'investment', nameAr: 'استثمار', type: 'income', icon: 'fas fa-chart-line', color: 'accent' },
      { id: randomUUID(), name: 'gift', nameAr: 'هدية', type: 'income', icon: 'fas fa-gift', color: 'warning' },
      { id: randomUUID(), name: 'other_income', nameAr: 'أخرى', type: 'income', icon: 'fas fa-circle', color: 'muted' },
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      note: insertTransaction.note || null,
      date: insertTransaction.date || new Date(),
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...updates };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(cat => cat.type === type);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return Array.from(this.goals.values());
  }

  async getGoal(id: string): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = randomUUID();
    const goal: Goal = {
      ...insertGoal,
      id,
      createdAt: new Date(),
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: string, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal = { ...goal, ...updates };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  async getActiveGoals(): Promise<Goal[]> {
    const now = new Date();
    return Array.from(this.goals.values()).filter(goal => 
      goal.isActive === 'true' && 
      new Date(goal.startDate) <= now && 
      new Date(goal.endDate) >= now
    );
  }
}

export const storage = new MemStorage();
