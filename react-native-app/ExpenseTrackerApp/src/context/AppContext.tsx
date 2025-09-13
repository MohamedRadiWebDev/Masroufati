import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Category } from '../types/schema';
import { StorageManager } from '../utils/storage';
import { DEFAULT_CATEGORIES } from '../constants/categories';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
}

interface AppContextType extends AppState {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  getTotalIncome: () => number;
  getTotalExpense: () => number;
  getBalance: () => number;
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByType: (type: 'income' | 'expense') => Transaction[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>({
    transactions: [],
    categories: DEFAULT_CATEGORIES,
    isLoading: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Initialize categories if they don't exist
      await StorageManager.initializeCategories();
      
      const [transactions, categories] = await Promise.all([
        StorageManager.getTransactions(),
        StorageManager.getCategories(),
      ]);

      setState({
        transactions,
        categories,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const now = new Date().toISOString();
      const newTransaction: Transaction = {
        ...transactionData,
        id: StorageManager.generateId(),
        date: transactionData.date || now, // Use provided date or current time
        createdAt: now,
      };

      await StorageManager.saveTransaction(newTransaction);
      
      setState(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTransaction],
      }));
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await StorageManager.updateTransaction(id, updates);
      
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => 
          t.id === id ? { ...t, ...updates } : t
        ),
      }));
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await StorageManager.deleteTransaction(id);
      
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  // Computed values
  const getTotalIncome = () => {
    return state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getBalance = () => {
    return getTotalIncome() - getTotalExpense();
  };

  const getTransactionsByCategory = (categoryId: string) => {
    return state.transactions.filter(t => t.category === categoryId);
  };

  const getTransactionsByType = (type: 'income' | 'expense') => {
    return state.transactions.filter(t => t.type === type);
  };

  const contextValue: AppContextType = {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refreshData,
    getTotalIncome,
    getTotalExpense,
    getBalance,
    getTransactionsByCategory,
    getTransactionsByType,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}