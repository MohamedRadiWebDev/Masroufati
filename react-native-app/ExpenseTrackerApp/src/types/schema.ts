// Simple types without Zod for React Native compatibility
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  nameAr: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note?: string;
  type: TransactionType;
  date: string;
  receiptImage?: string;
  createdAt: string;
}

export interface InsertTransaction {
  amount: number;
  category: string;
  note?: string;
  type: TransactionType;
  date: string;
  receiptImage?: string;
}

export interface Goal {
  id: string;
  title: string;
  titleAr: string;
  targetAmount: number;
  currentAmount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  categoryId?: string;
  createdAt: string;
}

export interface InsertGoal {
  title: string;
  titleAr: string;
  targetAmount: number;
  currentAmount?: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  categoryId?: string;
}

// Default Categories
export const DEFAULT_CATEGORIES: Category[] = [
  // Income Categories
  {
    id: 'salary',
    name: 'Salary',
    nameAr: 'راتب',
    type: 'income',
    icon: '💼',
    color: '#10b981',
  },
  {
    id: 'freelance',
    name: 'Freelance',
    nameAr: 'عمل حر',
    type: 'income',
    icon: '💻',
    color: '#059669',
  },
  {
    id: 'investment',
    name: 'Investment',
    nameAr: 'استثمار',
    type: 'income',
    icon: '📈',
    color: '#047857',
  },
  // Expense Categories
  {
    id: 'food',
    name: 'Food',
    nameAr: 'طعام',
    type: 'expense',
    icon: '🍽️',
    color: '#ef4444',
  },
  {
    id: 'transport',
    name: 'Transport',
    nameAr: 'مواصلات',
    type: 'expense',
    icon: '🚗',
    color: '#dc2626',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    nameAr: 'تسوق',
    type: 'expense',
    icon: '🛍️',
    color: '#b91c1c',
  },
  {
    id: 'bills',
    name: 'Bills',
    nameAr: 'فواتير',
    type: 'expense',
    icon: '📄',
    color: '#991b1b',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    nameAr: 'ترفيه',
    type: 'expense',
    icon: '🎬',
    color: '#7c2d12',
  },
  {
    id: 'health',
    name: 'Health',
    nameAr: 'صحة',
    type: 'expense',
    icon: '🏥',
    color: '#92400e',
  },
];