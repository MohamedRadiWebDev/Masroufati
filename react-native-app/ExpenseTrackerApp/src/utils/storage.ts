import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category } from '../types/schema';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const STORAGE_KEYS = {
  TRANSACTIONS: 'expense_tracker_transactions',
  CATEGORIES: 'expense_tracker_categories',
} as const;

export class StorageManager {
  // Transactions
  static async getTransactions(): Promise<Transaction[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  }

  static async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      transactions.push(transaction);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  static async updateTransaction(id: string, updatedTransaction: Partial<Transaction>): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const index = transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedTransaction };
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  static async deleteTransaction(id: string): Promise<void> {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return stored ? JSON.parse(stored) : [...DEFAULT_CATEGORIES];
    } catch (error) {
      console.error('Error loading categories:', error);
      return [...DEFAULT_CATEGORIES];
    }
  }

  static async saveCategories(newCategories: Category[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
    } catch (error) {
      console.error('Error saving categories:', error);
      throw error;
    }
  }

  // Initialize default categories if none exist
  static async initializeCategories(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!existing) {
        await this.saveCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  }

  // Generate unique ID
  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Clear all data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.CATEGORIES]);
      await this.initializeCategories();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}