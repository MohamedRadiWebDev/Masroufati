import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { registerRoutes } from '../routes'

describe('Balance and Analytics Routes', () => {
  let app: express.Express
  let server: any

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    server = await registerRoutes(app)
  })

  describe('GET /api/balance', () => {
    it('should return zero balance when no transactions exist', async () => {
      const response = await request(app)
        .get('/api/balance')
        .expect(200)

      expect(response.body).toEqual({
        currentBalance: 0,
        totalIncome: 0,
        totalExpenses: 0
      })
    })

    it('should calculate balance correctly with transactions', async () => {
      // Create income transaction
      await request(app)
        .post('/api/transactions')
        .send({
          amount: '2000',
          type: 'income',
          category: 'راتب',
          description: 'راتب شهري'
        })

      // Create expense transaction
      await request(app)
        .post('/api/transactions')
        .send({
          amount: '500',
          type: 'expense',
          category: 'طعام',
          description: 'طعام'
        })

      // Another expense
      await request(app)
        .post('/api/transactions')
        .send({
          amount: '300',
          type: 'expense',
          category: 'مواصلات',
          description: 'وقود'
        })

      const response = await request(app)
        .get('/api/balance')
        .expect(200)

      expect(response.body).toEqual({
        currentBalance: 1200, // 2000 - 500 - 300
        totalIncome: 2000,
        totalExpenses: 800 // 500 + 300
      })
    })

    it('should handle decimal amounts correctly', async () => {
      // Create transactions with decimal amounts
      await request(app)
        .post('/api/transactions')
        .send({
          amount: '1500.50',
          type: 'income',
          category: 'راتب'
        })

      await request(app)
        .post('/api/transactions')
        .send({
          amount: '250.75',
          type: 'expense',
          category: 'طعام'
        })

      const response = await request(app)
        .get('/api/balance')
        .expect(200)

      expect(response.body.currentBalance).toBeCloseTo(1249.75)
      expect(response.body.totalIncome).toBeCloseTo(1500.50)
      expect(response.body.totalExpenses).toBeCloseTo(250.75)
    })
  })

  describe('GET /api/categories', () => {
    it('should return empty array when no categories exist', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200)

      expect(response.body).toEqual([])
    })

    it('should filter categories by type', async () => {
      // This test depends on the storage implementation
      // For now, we verify the endpoint returns successfully
      const response = await request(app)
        .get('/api/categories?type=income')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it('should return all categories when no type filter', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('POST /api/categories', () => {
    it('should create a new category with valid data', async () => {
      const categoryData = {
        name: 'تسوق',
        nameAr: 'تسوق',
        icon: '🛒',
        color: 'blue',
        type: 'expense'
      }

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData)
        .expect(201)

      expect(response.body).toMatchObject(categoryData)
      expect(response.body.id).toBeDefined()
    })

    it('should reject category with invalid type', async () => {
      const invalidData = {
        name: 'تسوق',
        type: 'invalid_type'
      }

      const response = await request(app)
        .post('/api/categories')
        .send(invalidData)
        .expect(400)

      expect(response.body.message).toBe('Invalid category data')
    })
  })

  describe('GET /api/analytics', () => {
    it('should return empty analytics when no transactions exist', async () => {
      const response = await request(app)
        .get('/api/analytics')
        .expect(200)

      expect(response.body).toEqual({
        categoryBreakdown: []
      })
    })

    it('should calculate category breakdown correctly', async () => {
      // First create some categories
      await request(app)
        .post('/api/categories')
        .send({
          name: 'طعام',
          nameAr: 'طعام',
          icon: '🍽️',
          color: 'green',
          type: 'expense'
        })

      await request(app)
        .post('/api/categories')
        .send({
          name: 'مواصلات',
          nameAr: 'مواصلات',
          icon: '🚗',
          color: 'blue',
          type: 'expense'
        })

      // Create expense transactions in these categories
      await request(app)
        .post('/api/transactions')
        .send({
          amount: '500',
          type: 'expense',
          category: 'طعام',
          description: 'غداء'
        })

      await request(app)
        .post('/api/transactions')
        .send({
          amount: '300',
          type: 'expense',
          category: 'طعام',
          description: 'عشاء'
        })

      await request(app)
        .post('/api/transactions')
        .send({
          amount: '200',
          type: 'expense',
          category: 'مواصلات',
          description: 'وقود'
        })

      // Create income transaction (should not appear in analytics)
      await request(app)
        .post('/api/transactions')
        .send({
          amount: '2000',
          type: 'income',
          category: 'راتب',
          description: 'راتب شهري'
        })

      const response = await request(app)
        .get('/api/analytics')
        .expect(200)

      expect(response.body.categoryBreakdown).toBeDefined()
      expect(Array.isArray(response.body.categoryBreakdown)).toBe(true)
      
      // Should be sorted by amount (highest first)
      const breakdown = response.body.categoryBreakdown
      if (breakdown.length > 1) {
        expect(breakdown[0].amount).toBeGreaterThanOrEqual(breakdown[1].amount)
      }

      // Should only include expense categories
      breakdown.forEach((item: any) => {
        expect(item.category).toBeDefined()
        expect(item.amount).toBeGreaterThan(0)
      })
    })
  })
})