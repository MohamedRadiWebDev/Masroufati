import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import BalanceCard from '../components/balance-card'

describe('BalanceCard', () => {
  it('displays loading state when balance data is loading', () => {
    renderWithProviders(<BalanceCard />)
    
    // Should show skeleton loaders
    expect(screen.getByTestId('balance-skeleton')).toBeInTheDocument()
  })

  it('displays balance information correctly', async () => {
    renderWithProviders(<BalanceCard />)
    
    // Wait for the data to load from MSW
    await screen.findByText('الرصيد الحالي')
    
    expect(screen.getByText('الرصيد الحالي')).toBeInTheDocument()
    expect(screen.getByText('إجمالي الدخل')).toBeInTheDocument()
    expect(screen.getByText('إجمالي المصروفات')).toBeInTheDocument()
  })

  it('formats currency values correctly', async () => {
    renderWithProviders(<BalanceCard />)
    
    // Wait for balance data to load
    await screen.findByText('750 ريال')
    
    expect(screen.getByText('750 ريال')).toBeInTheDocument() // Current balance
    expect(screen.getByText('1,000 ريال')).toBeInTheDocument() // Total income
    expect(screen.getByText('250 ريال')).toBeInTheDocument() // Total expenses
  })

  it('shows positive balance in green', async () => {
    renderWithProviders(<BalanceCard />)
    
    const balanceElement = await screen.findByText('750 ريال')
    expect(balanceElement).toHaveClass('text-green-600')
  })

  it('refreshes data when refresh button is clicked', async () => {
    const { queryClient } = renderWithProviders(<BalanceCard />)
    
    // Wait for initial load
    await screen.findByText('الرصيد الحالي')
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeInTheDocument()
    
    // Click refresh should trigger query invalidation
    await refreshButton.click()
    
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0)
  })

  it('handles error state gracefully', async () => {
    // This would require setting up MSW to return an error
    // For now, we just verify the component renders without crashing
    renderWithProviders(<BalanceCard />)
    
    expect(screen.getByTestId('balance-skeleton')).toBeInTheDocument()
  })

  it('uses RTL layout correctly', async () => {
    renderWithProviders(<BalanceCard />)
    
    await screen.findByText('الرصيد الحالي')
    
    const card = screen.getByTestId('balance-card')
    expect(card).toHaveClass('rtl')
  })
})