import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import { registerRoutes } from '../routes'

describe('Transaction Routes', () => {
  let app: express.Express
  let server: any

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    server = await registerRoutes(app)
  })

  describe('GET /api/transactions', () => {
    it('should return empty array when no transactions exist', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .expect(200)

      expect(response.body).toEqual([])
    })
  })

  describe('POST /api/transactions', () => {
    it('should create a new transaction with valid data', async () => {
      const transactionData = {
        amount: '1000',
        type: 'income',
        category: 'راتب',
        description: 'راتب شهري'
      }

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201)

      expect(response.body).toMatchObject({
        amount: '1000',
        type: 'income',
        category: 'راتب',
        description: 'راتب شهري'
      })
      expect(response.body.id).toBeDefined()
      expect(response.body.createdAt).toBeDefined()
    })

    it('should reject transaction with invalid amount', async () => {
      const invalidData = {
        amount: 'invalid',
        type: 'income',
        category: 'راتب'
      }

      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400)

      expect(response.body.message).toBe('Invalid transaction data')
      expect(response.body.errors).toBeDefined()
    })

    it('should reject transaction with invalid type', async () => {
      const invalidData = {
        amount: '1000',
        type: 'invalid_type',
        category: 'راتب'
      }

      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400)

      expect(response.body.message).toBe('Invalid transaction data')
    })

    it('should reject transaction with missing required fields', async () => {
      const invalidData = {
        amount: '1000'
        // missing type and category
      }

      await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400)
    })
  })

  describe('GET /api/transactions/:id', () => {
    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/non-existent-id')
        .expect(404)

      expect(response.body.message).toBe('Transaction not found')
    })

    it('should return transaction by id', async () => {
      // First create a transaction
      const transactionData = {
        amount: '500',
        type: 'expense',
        category: 'طعام',
        description: 'غداء'
      }

      const createResponse = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201)

      const transactionId = createResponse.body.id

      // Then retrieve it
      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(200)

      expect(response.body).toMatchObject(transactionData)
      expect(response.body.id).toBe(transactionId)
    })
  })

  describe('PUT /api/transactions/:id', () => {
    it('should update existing transaction', async () => {
      // First create a transaction
      const transactionData = {
        amount: '500',
        type: 'expense',
        category: 'طعام',
        description: 'غداء'
      }

      const createResponse = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201)

      const transactionId = createResponse.body.id

      // Then update it
      const updateData = {
        amount: '600',
        description: 'عشاء'
      }

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .send(updateData)
        .expect(200)

      expect(response.body.amount).toBe('600')
      expect(response.body.description).toBe('عشاء')
      expect(response.body.type).toBe('expense') // Should preserve unchanged fields
      expect(response.body.category).toBe('طعام')
    })

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .put('/api/transactions/non-existent-id')
        .send({ amount: '1000' })
        .expect(404)

      expect(response.body.message).toBe('Transaction not found')
    })
  })

  describe('DELETE /api/transactions/:id', () => {
    it('should delete existing transaction', async () => {
      // First create a transaction
      const transactionData = {
        amount: '500',
        type: 'expense',
        category: 'طعام'
      }

      const createResponse = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201)

      const transactionId = createResponse.body.id

      // Then delete it
      await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .expect(204)

      // Verify it's gone
      await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(404)
    })

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .delete('/api/transactions/non-existent-id')
        .expect(404)

      expect(response.body.message).toBe('Transaction not found')
    })
  })
})