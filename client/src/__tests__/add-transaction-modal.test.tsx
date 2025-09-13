import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, userEvent } from '../test-utils'
import AddTransactionModal from '../components/add-transaction-modal'

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('AddTransactionModal', () => {
  const defaultProps = {
    type: 'expense' as const,
    open: true,
    onOpenChange: vi.fn(),
  }

  it('renders modal with correct title for expense', () => {
    renderWithProviders(<AddTransactionModal {...defaultProps} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('إضافة مصروف')).toBeInTheDocument()
  })

  it('renders modal with correct title for income', () => {
    renderWithProviders(
      <AddTransactionModal {...defaultProps} type="income" />
    )
    
    expect(screen.getByText('إضافة دخل')).toBeInTheDocument()
  })

  it('displays form fields correctly', () => {
    renderWithProviders(<AddTransactionModal {...defaultProps} />)
    
    expect(screen.getByLabelText('المبلغ')).toBeInTheDocument()
    expect(screen.getByLabelText('التصنيف')).toBeInTheDocument()
    expect(screen.getByLabelText('ملاحظة (اختياري)')).toBeInTheDocument()
    expect(screen.getByLabelText('التاريخ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'إضافة' })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddTransactionModal {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'إضافة' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('المبلغ مطلوب')).toBeInTheDocument()
      expect(screen.getByText('التصنيف مطلوب')).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid amount', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddTransactionModal {...defaultProps} />)
    
    const amountInput = screen.getByLabelText('المبلغ')
    await user.type(amountInput, '0')
    
    const submitButton = screen.getByRole('button', { name: 'إضافة' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('المبلغ يجب أن يكون أكبر من صفر')).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    
    renderWithProviders(
      <AddTransactionModal {...defaultProps} onOpenChange={onOpenChange} />
    )
    
    // Fill in form fields
    const amountInput = screen.getByLabelText('المبلغ')
    await user.type(amountInput, '500')
    
    // Wait for categories to load and select one
    await waitFor(() => {
      const categorySelect = screen.getByLabelText('التصنيف')
      expect(categorySelect).toBeInTheDocument()
    })
    
    const noteInput = screen.getByLabelText('ملاحظة (اختياري)')
    await user.type(noteInput, 'تسوق طعام')
    
    const submitButton = screen.getByRole('button', { name: 'إضافة' })
    await user.click(submitButton)
    
    // Modal should be closed on successful submission
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    
    renderWithProviders(
      <AddTransactionModal {...defaultProps} onOpenChange={onOpenChange} />
    )
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('enables voice input button', () => {
    renderWithProviders(<AddTransactionModal {...defaultProps} />)
    
    const voiceButton = screen.getByRole('button', { name: /voice/i })
    expect(voiceButton).toBeInTheDocument()
    expect(voiceButton).not.toBeDisabled()
  })

  it('pre-fills current date', () => {
    renderWithProviders(<AddTransactionModal {...defaultProps} />)
    
    const dateInput = screen.getByLabelText('التاريخ') as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })
})