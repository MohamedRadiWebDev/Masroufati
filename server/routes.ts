import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transaction" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, validatedData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTransaction(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const type = req.query.type as 'income' | 'expense' | undefined;
      const categories = type 
        ? await storage.getCategoriesByType(type)
        : await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Balance calculation endpoint
  app.get("/api/balance", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const currentBalance = totalIncome - totalExpenses;
      
      res.json({
        currentBalance,
        totalIncome,
        totalExpenses
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate balance" });
    }
  });


  // Analytics endpoint (Enhanced with monthly data)
  app.get("/api/analytics", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const categories = await storage.getCategories();
      
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
      
      res.json({
        categoryBreakdown
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  // Monthly spending trends endpoint
  app.get("/api/analytics/monthly-trends", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const months = parseInt(req.query.months as string) || 6; // Default to last 6 months
      
      // Get last N months
      const now = new Date();
      const monthlyData = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getFullYear() === date.getFullYear() && 
                 transactionDate.getMonth() === date.getMonth();
        });
        
        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
          
        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const monthNameAr = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ][date.getMonth()];
        
        monthlyData.push({
          month: monthKey,
          monthName: monthNameAr,
          year: date.getFullYear(),
          income,
          expenses,
          balance: income - expenses,
          savings: income > 0 ? ((income - expenses) / income * 100) : 0
        });
      }
      
      res.json({ monthlyData });
    } catch (error) {
      res.status(500).json({ message: "Failed to get monthly trends" });
    }
  });

  // Spending patterns analysis endpoint
  app.get("/api/analytics/spending-patterns", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const categories = await storage.getCategories();
      
      // Analyze by day of week
      const dayOfWeekSpending = Array(7).fill(0);
      const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      
      // Analyze by time of month (first half vs second half)
      let firstHalfSpending = 0;
      let secondHalfSpending = 0;
      
      // Category trends over time
      const categoryTrends: Record<string, number[]> = {};
      const last6Months: Array<{year: number, month: number}> = [];
      
      // Get last 6 months for trends
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          year: date.getFullYear(),
          month: date.getMonth()
        });
      }
      
      transactions.filter(t => t.type === 'expense').forEach(transaction => {
        const date = new Date(transaction.date);
        
        // Day of week analysis
        dayOfWeekSpending[date.getDay()] += parseFloat(transaction.amount);
        
        // First/Second half of month
        if (date.getDate() <= 15) {
          firstHalfSpending += parseFloat(transaction.amount);
        } else {
          secondHalfSpending += parseFloat(transaction.amount);
        }
        
        // Category trends
        if (!categoryTrends[transaction.category]) {
          categoryTrends[transaction.category] = Array(6).fill(0);
        }
        
        const monthIndex = last6Months.findIndex(m => 
          m.year === date.getFullYear() && m.month === date.getMonth()
        );
        if (monthIndex >= 0) {
          categoryTrends[transaction.category][monthIndex] += parseFloat(transaction.amount);
        }
      });
      
      // Format day of week data
      const dayOfWeekData = dayOfWeekSpending.map((amount, index) => ({
        day: dayNames[index],
        amount,
        dayIndex: index
      }));
      
      // Format category trends with Arabic names
      const categoryTrendsFormatted = Object.entries(categoryTrends).map(([categoryName, amounts]) => {
        const category = categories.find(c => c.name === categoryName);
        return {
          category: categoryName,
          categoryAr: category?.nameAr || categoryName,
          color: category?.color || 'muted',
          amounts
        };
      }).sort((a, b) => {
        const aTotal = a.amounts.reduce((sum, amt) => sum + amt, 0);
        const bTotal = b.amounts.reduce((sum, amt) => sum + amt, 0);
        return bTotal - aTotal;
      });
      
      res.json({
        dayOfWeekSpending: dayOfWeekData,
        monthHalfSpending: {
          firstHalf: firstHalfSpending,
          secondHalf: secondHalfSpending,
          percentage: {
            firstHalf: firstHalfSpending + secondHalfSpending > 0 ? 
              (firstHalfSpending / (firstHalfSpending + secondHalfSpending) * 100) : 50,
            secondHalf: firstHalfSpending + secondHalfSpending > 0 ? 
              (secondHalfSpending / (firstHalfSpending + secondHalfSpending) * 100) : 50
          }
        },
        categoryTrends: categoryTrendsFormatted
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get spending patterns" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
