import { type Transaction, type Category, type InsertTransaction, type InsertCategory, type Goal, type InsertGoal } from "@shared/schema";

export class LocalStorageManager {
  private readonly TRANSACTIONS_KEY = 'expense_tracker_transactions';
  private readonly CATEGORIES_KEY = 'expense_tracker_categories';
  private readonly GOALS_KEY = 'expense_tracker_goals';
  private readonly INITIALIZED_KEY = 'expense_tracker_initialized';

  constructor() {
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const initialized = localStorage.getItem(this.INITIALIZED_KEY);
    if (!initialized) {
      const defaultCategories: Category[] = [
        // Expense categories
        { id: this.generateId(), name: 'food', nameAr: 'أكل وشرب', type: 'expense', icon: 'fas fa-utensils', color: 'warning' },
        { id: this.generateId(), name: 'transport', nameAr: 'مواصلات', type: 'expense', icon: 'fas fa-car', color: 'primary' },
        { id: this.generateId(), name: 'bills', nameAr: 'فواتير', type: 'expense', icon: 'fas fa-file-invoice', color: 'secondary' },
        { id: this.generateId(), name: 'shopping', nameAr: 'تسوق', type: 'expense', icon: 'fas fa-shopping-bag', color: 'destructive' },
        { id: this.generateId(), name: 'entertainment', nameAr: 'ترفيه', type: 'expense', icon: 'fas fa-gamepad', color: 'accent' },
        { id: this.generateId(), name: 'health', nameAr: 'صحة', type: 'expense', icon: 'fas fa-heart', color: 'success' },
        { id: this.generateId(), name: 'other', nameAr: 'أخرى', type: 'expense', icon: 'fas fa-circle', color: 'muted' },
        
        // Income categories
        { id: this.generateId(), name: 'salary', nameAr: 'راتب', type: 'income', icon: 'fas fa-briefcase', color: 'success' },
        { id: this.generateId(), name: 'freelance', nameAr: 'عمل حر', type: 'income', icon: 'fas fa-laptop', color: 'primary' },
        { id: this.generateId(), name: 'business', nameAr: 'تجارة', type: 'income', icon: 'fas fa-store', color: 'secondary' },
        { id: this.generateId(), name: 'investment', nameAr: 'استثمار', type: 'income', icon: 'fas fa-chart-line', color: 'accent' },
        { id: this.generateId(), name: 'gift', nameAr: 'هدية', type: 'income', icon: 'fas fa-gift', color: 'warning' },
        { id: this.generateId(), name: 'other_income', nameAr: 'أخرى', type: 'income', icon: 'fas fa-circle', color: 'muted' },
      ];

      this.saveToLocalStorage(this.CATEGORIES_KEY, defaultCategories);
      localStorage.setItem(this.INITIALIZED_KEY, 'true');
    }
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private saveToLocalStorage<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      throw new Error('فشل في حفظ البيانات في التخزين المحلي');
    }
  }

  private loadFromLocalStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return [];
    }
  }

  // Transaction methods
  getTransactions(): Promise<Transaction[]> {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return Promise.resolve(transactions);
  }

  getTransaction(id: string): Promise<Transaction | undefined> {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    const transaction = transactions.find(t => t.id === id);
    return Promise.resolve(transaction);
  }

  createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    const newTransaction: Transaction = {
      ...insertTransaction,
      id: this.generateId(),
      note: insertTransaction.note || null,
      date: insertTransaction.date || new Date(),
      createdAt: new Date(),
    };
    
    transactions.push(newTransaction);
    this.saveToLocalStorage(this.TRANSACTIONS_KEY, transactions);
    return Promise.resolve(newTransaction);
  }

  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      return Promise.resolve(undefined);
    }

    transactions[index] = { ...transactions[index], ...updates };
    this.saveToLocalStorage(this.TRANSACTIONS_KEY, transactions);
    return Promise.resolve(transactions[index]);
  }

  deleteTransaction(id: string): Promise<boolean> {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    const initialLength = transactions.length;
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === initialLength) {
      return Promise.resolve(false);
    }

    this.saveToLocalStorage(this.TRANSACTIONS_KEY, filteredTransactions);
    return Promise.resolve(true);
  }

  // Category methods
  getCategories(): Promise<Category[]> {
    const categories = this.loadFromLocalStorage<Category>(this.CATEGORIES_KEY);
    return Promise.resolve(categories);
  }

  getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    const categories = this.loadFromLocalStorage<Category>(this.CATEGORIES_KEY);
    const filteredCategories = categories.filter(cat => cat.type === type);
    return Promise.resolve(filteredCategories);
  }

  createCategory(insertCategory: InsertCategory): Promise<Category> {
    const categories = this.loadFromLocalStorage<Category>(this.CATEGORIES_KEY);
    const newCategory: Category = {
      ...insertCategory,
      id: this.generateId(),
    };
    
    categories.push(newCategory);
    this.saveToLocalStorage(this.CATEGORIES_KEY, categories);
    return Promise.resolve(newCategory);
  }

  // Balance calculation
  async getBalance(): Promise<{ currentBalance: number; totalIncome: number; totalExpenses: number }> {
    const transactions = await this.getTransactions();
    
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const currentBalance = totalIncome - totalExpenses;
    
    return {
      currentBalance,
      totalIncome,
      totalExpenses
    };
  }

  // Analytics data
  async getAnalytics(): Promise<{ categoryBreakdown: any[] }> {
    const transactions = await this.getTransactions();
    const categories = await this.getCategories();
    
    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        if (!expensesByCategory[transaction.category]) {
          expensesByCategory[transaction.category] = 0;
        }
        expensesByCategory[transaction.category] += parseFloat(transaction.amount);
      });
    
    // Add category names and colors
    const categoryBreakdown = Object.entries(expensesByCategory).map(([categoryName, amount]) => {
      const category = categories.find(c => c.name === categoryName);
      return {
        category: categoryName,
        categoryAr: category?.nameAr || categoryName,
        amount,
        color: category?.color || 'muted',
        icon: category?.icon || 'fas fa-circle'
      };
    }).sort((a, b) => b.amount - a.amount);
    
    return {
      categoryBreakdown
    };
  }

  // Goal methods
  getGoals(): Promise<Goal[]> {
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    return Promise.resolve(goals);
  }

  getGoal(id: string): Promise<Goal | undefined> {
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    const goal = goals.find(g => g.id === id);
    return Promise.resolve(goal);
  }

  createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    const newGoal: Goal = {
      ...insertGoal,
      id: this.generateId(),
      createdAt: new Date(),
    };
    
    goals.push(newGoal);
    this.saveToLocalStorage(this.GOALS_KEY, goals);
    return Promise.resolve(newGoal);
  }

  updateGoal(id: string, updates: Partial<InsertGoal>): Promise<Goal | undefined> {
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    const goalIndex = goals.findIndex(g => g.id === id);
    
    if (goalIndex === -1) {
      return Promise.resolve(undefined);
    }
    
    goals[goalIndex] = { ...goals[goalIndex], ...updates };
    this.saveToLocalStorage(this.GOALS_KEY, goals);
    return Promise.resolve(goals[goalIndex]);
  }

  deleteGoal(id: string): Promise<boolean> {
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    const filteredGoals = goals.filter(g => g.id !== id);
    
    if (filteredGoals.length === goals.length) {
      return Promise.resolve(false); // Goal not found
    }
    
    this.saveToLocalStorage(this.GOALS_KEY, filteredGoals);
    return Promise.resolve(true);
  }

  getActiveGoals(): Promise<Goal[]> {
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    const now = new Date();
    const activeGoals = goals.filter(goal => 
      goal.isActive === 'true' && 
      new Date(goal.startDate) <= now && 
      new Date(goal.endDate) >= now
    );
    return Promise.resolve(activeGoals);
  }

  // Calculate goal progress
  async getGoalProgress(goalId: string): Promise<{ spent: number; percentage: number; remaining: number } | null> {
    const goal = await this.getGoal(goalId);
    if (!goal) return null;

    const transactions = await this.getTransactions();
    const goalStartDate = new Date(goal.startDate);
    const goalEndDate = new Date(goal.endDate);

    // Filter transactions within goal period and category (if specified)
    const relevantTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const isInPeriod = transactionDate >= goalStartDate && transactionDate <= goalEndDate;
      const isExpense = transaction.type === 'expense';
      const isRightCategory = !goal.category || transaction.category === goal.category;
      
      return isInPeriod && isExpense && isRightCategory;
    });

    const spent = relevantTransactions.reduce((sum, transaction) => 
      sum + parseFloat(transaction.amount), 0
    );
    
    const targetAmount = parseFloat(goal.targetAmount);
    const percentage = targetAmount > 0 ? (spent / targetAmount) * 100 : 0;
    const remaining = Math.max(0, targetAmount - spent);

    return { spent, percentage, remaining };
  }

  // Clear all data (for debugging or reset)
  clearAllData(): void {
    localStorage.removeItem(this.TRANSACTIONS_KEY);
    localStorage.removeItem(this.CATEGORIES_KEY);
    localStorage.removeItem(this.GOALS_KEY);
    localStorage.removeItem(this.INITIALIZED_KEY);
    this.initializeDefaultCategories();
  }

  // Export data
  exportToJSON(): string {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    const categories = this.loadFromLocalStorage<Category>(this.CATEGORIES_KEY);
    const goals = this.loadFromLocalStorage<Goal>(this.GOALS_KEY);
    
    return JSON.stringify({
      transactions,
      categories,
      goals,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  // Import data  
  importFromJSON(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      if (data.transactions) {
        this.saveToLocalStorage(this.TRANSACTIONS_KEY, data.transactions);
      }
      if (data.categories) {
        this.saveToLocalStorage(this.CATEGORIES_KEY, data.categories);
      }
      if (data.goals) {
        this.saveToLocalStorage(this.GOALS_KEY, data.goals);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('فشل في استيراد البيانات');
    }
  }
}

export const localStorageManager = new LocalStorageManager();