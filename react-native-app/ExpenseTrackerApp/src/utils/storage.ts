import { Transaction, Category } from '../types/schema';
import { DEFAULT_CATEGORIES } from '../constants/categories';

// Simple in-memory storage for now - will be replaced with AsyncStorage later
let transactions: Transaction[] = [];
let categories: Category[] = [...DEFAULT_CATEGORIES];

export class StorageManager {
  // Transactions
  static async getTransactions(): Promise<Transaction[]> {
    return [...transactions];
  }

  static async saveTransaction(transaction: Transaction): Promise<void> {
    transactions.push(transaction);
  }

  static async updateTransaction(id: string, updatedTransaction: Partial<Transaction>): Promise<void> {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updatedTransaction };
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    transactions = transactions.filter(t => t.id !== id);
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    return [...categories];
  }

  static async saveCategories(newCategories: Category[]): Promise<void> {
    categories = [...newCategories];
  }

  // Generate unique ID
  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    transactions = [];
    categories = [...DEFAULT_CATEGORIES];
  }
}