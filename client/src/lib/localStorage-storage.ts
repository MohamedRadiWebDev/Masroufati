import { type Transaction, type Category, type InsertTransaction, type InsertCategory } from "@shared/schema";

export class LocalStorageManager {
  private readonly TRANSACTIONS_KEY = 'expense_tracker_transactions';
  private readonly CATEGORIES_KEY = 'expense_tracker_categories';
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

  // Transaction methods with lazy loading support
  getTransactions(page = 1, limit = 50): Promise<Transaction[]> {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Apply pagination if requested
    if (page > 1 || (limit < transactions.length && limit > 0)) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return Promise.resolve(transactions.slice(startIndex, endIndex));
    }
    
    return Promise.resolve(transactions);
  }

  getAllTransactions(): Promise<Transaction[]> {
    return this.getTransactions(1, Number.MAX_SAFE_INTEGER);
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
      receiptImage: insertTransaction.receiptImage || null,
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
    const transactions = await this.getAllTransactions();
    
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
    const transactions = await this.getAllTransactions();
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


  // Clear all data (for debugging or reset)
  clearAllData(): void {
    localStorage.removeItem(this.TRANSACTIONS_KEY);
    localStorage.removeItem(this.CATEGORIES_KEY);
    localStorage.removeItem(this.INITIALIZED_KEY);
    this.initializeDefaultCategories();
  }

  // Export data
  exportToJSON(): string {
    const transactions = this.loadFromLocalStorage<Transaction>(this.TRANSACTIONS_KEY);
    const categories = this.loadFromLocalStorage<Category>(this.CATEGORIES_KEY);
    
    return JSON.stringify({
      transactions,
      categories,
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
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('فشل في استيراد البيانات');
    }
  }
}

export const localStorageManager = new LocalStorageManager();