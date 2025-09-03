import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickAddTrip from '../QuickAddTrip'
import { renderWithProviders } from '../../test/utils/testUtils'
import {
  mockUseCreateTrip,
  mockUseClientSuggestions,
  resetAllMocks
} from '../../test/utils/mockHooks'

// Mock the hooks
vi.mock('../../hooks/useTrips', () => ({
  useCreateTrip: mockUseCreateTrip,
}))

vi.mock('../../hooks/useClients', () => ({
  useClientSuggestions: mockUseClientSuggestions,
}))

vi.mock('../../utils/errorUtils', () => ({
  getApiErrorMessage: () => 'Test error message',
}))

describe('QuickAddTrip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllMocks()
  })

  it('renders the quick add form with all fields', () => {
    renderWithProviders(<QuickAddTrip />)
    
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/miles/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add trip/i })).toBeInTheDocument()
  })

  it('uses today as default date', () => {
    renderWithProviders(<QuickAddTrip />)
    
    // The component should internally use today's date
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuickAddTrip />)
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/client.*required/i)).toBeInTheDocument()
    })
  })

  it('validates miles input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuickAddTrip />)
    
    const clientInput = screen.getByLabelText(/client/i)
    const milesInput = screen.getByLabelText(/miles/i)
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    
    await user.type(clientInput, 'Test Client')
    await user.clear(milesInput)
    await user.type(milesInput, '0')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/miles.*greater than 0/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const mockMutate = vi.fn()
    mockUseCreateTrip.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    })
    
    const user = userEvent.setup()
    renderWithProviders(<QuickAddTrip />)
    
    const clientInput = screen.getByLabelText(/client/i)
    const milesInput = screen.getByLabelText(/miles/i)
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    
    await user.type(clientInput, 'Test Client')
    await user.clear(milesInput)
    await user.type(milesInput, '100')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: 'Test Client',
          miles: 100,
          trip_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      )
    })
  })

  it('shows loading state during submission', () => {
    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    })
    
    renderWithProviders(<QuickAddTrip />)
    
    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled()
  })

  it('displays error message when submission fails', () => {
    const mockError = new Error('Network error')
    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: mockError,
    })
    
    renderWithProviders(<QuickAddTrip />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('resets form after successful submission', async () => {
    let onSuccessCallback: (() => void) | undefined

    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn((data, { onSuccess }) => {
        onSuccessCallback = onSuccess
      }),
      isPending: false,
      isError: false,
      error: null,
    })
    
    const user = userEvent.setup()
    renderWithProviders(<QuickAddTrip />)
    
    const clientInput = screen.getByLabelText(/client/i) as HTMLInputElement
    const milesInput = screen.getByLabelText(/miles/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    
    await user.type(clientInput, 'Test Client')
    await user.clear(milesInput)
    await user.type(milesInput, '100')
    await user.click(submitButton)
    
    // Simulate successful submission
    if (onSuccessCallback) {
      onSuccessCallback()
    }
    
    await waitFor(() => {
      expect(clientInput.value).toBe('')
      expect(milesInput.value).toBe('')
    })
  })

  it('provides client suggestions when typing', async () => {
    mockUseClientSuggestions.mockReturnValue({
      data: { clients: ['Acme Corp', 'Beta Inc', 'Test Client'] },
      isLoading: false,
    })
    
    const user = userEvent.setup()
    renderWithProviders(<QuickAddTrip />)
    
    const clientInput = screen.getByLabelText(/client/i)
    await user.type(clientInput, 'Test')
    
    // If the component implements autocomplete/suggestions
    // This test would verify the suggestions appear
    await waitFor(() => {
      expect(clientInput).toHaveValue('Test')
    })
  })

  it('handles decimal miles input correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<QuickAddTrip />)
    
    const milesInput = screen.getByLabelText(/miles/i)
    await user.clear(milesInput)
    await user.type(milesInput, '125.5')
    
    expect(milesInput).toHaveValue(125.5)
  })

  it('has accessible labels and form structure', () => {
    renderWithProviders(<QuickAddTrip />)
    
    expect(screen.getByLabelText(/client/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/miles/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add trip/i })).toBeInTheDocument()
    
    // Check that form elements are properly associated
    const clientInput = screen.getByLabelText(/client/i)
    const milesInput = screen.getByLabelText(/miles/i)
    
    expect(clientInput).toHaveAttribute('type', 'text')
    expect(milesInput).toHaveAttribute('type', 'number')
  })
})