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


  // Analytics endpoint
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

  const httpServer = createServer(app);

  return httpServer;
}
