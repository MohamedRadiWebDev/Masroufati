import { http, HttpResponse } from 'msw'

export const handlers = [
  // Transactions API
  http.get('/api/transactions', () => {
    return HttpResponse.json([
      {
        id: '1',
        amount: 1000,
        type: 'income',
        categoryId: 'salary',
        description: 'راتب شهري',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        amount: 250,
        type: 'expense',
        categoryId: 'food',
        description: 'طعام',
        createdAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/transactions', async ({ request }) => {
    const transaction = await request.json() as any
    return HttpResponse.json({
      id: Math.random().toString(),
      ...transaction,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }),

  // Balance API
  http.get('/api/balance', () => {
    return HttpResponse.json({
      totalIncome: 1000,
      totalExpenses: 250,
      balance: 750,
    })
  }),

  // Categories API
  http.get('/api/categories', () => {
    return HttpResponse.json([
      { id: 'salary', name: 'راتب', icon: '💰', type: 'income' },
      { id: 'food', name: 'طعام', icon: '🍽️', type: 'expense' },
      { id: 'transport', name: 'مواصلات', icon: '🚗', type: 'expense' },
    ])
  }),

  // Goals API
  http.get('/api/goals', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'توفير للسفر',
        targetAmount: 5000,
        currentAmount: 1500,
        period: 'yearly',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ])
  }),

  http.post('/api/goals', async ({ request }) => {
    const goal = await request.json() as any
    return HttpResponse.json({
      id: Math.random().toString(),
      ...goal,
      currentAmount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }, { status: 201 })
  }),

  // Analytics API
  http.get('/api/analytics', () => {
    return HttpResponse.json({
      categoryBreakdown: [
        { categoryId: 'food', categoryName: 'طعام', amount: 250, percentage: 100 },
      ],
      monthlyTrends: [],
    })
  }),
]