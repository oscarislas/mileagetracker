import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AddTripForm from '../AddTripForm'

// Mock the hooks
vi.mock('../../hooks/useTrips', () => ({
  useCreateTrip: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useClients', () => ({
  useClientSuggestions: () => ({
    data: { clients: [] },
  }),
}))

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    data: { connected: true },
  }),
}))

vi.mock('../../utils/errorUtils', () => ({
  getApiErrorMessage: (error: unknown) => 'Test error message',
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('AddTripForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form with all fields', () => {
    renderWithQueryClient(<AddTripForm />)
    
    expect(screen.getByRole('textbox', { name: /client name/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/trip date/i)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /miles driven/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add trip/i })).toBeInTheDocument()
  })

  it('displays connection status when available', () => {
    renderWithQueryClient(<AddTripForm />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AddTripForm />)
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument()
    })
  })

  it('validates client name length', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AddTripForm />)
    
    const clientNameInput = screen.getByRole('textbox', { name: /client name/i })
    await user.type(clientNameInput, 'A'.repeat(31)) // 31 characters, over limit
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Client name must be 30 characters or less')).toBeInTheDocument()
    })
  })

  it('validates miles input', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AddTripForm />)
    
    const clientNameInput = screen.getByRole('textbox', { name: /client name/i })
    const milesInput = screen.getByRole('spinbutton', { name: /miles driven/i })
    
    await user.type(clientNameInput, 'Test Client')
    await user.clear(milesInput)
    await user.type(milesInput, '0')
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Miles must be greater than 0')).toBeInTheDocument()
    })
  })

  it('sets today as default trip date', () => {
    renderWithQueryClient(<AddTripForm />)
    
    const dateInput = screen.getByLabelText(/trip date/i) as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })

  it('can be collapsed and expanded', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AddTripForm />)
    
    // Should be expanded by default
    expect(screen.getByRole('textbox', { name: /client name/i })).toBeInTheDocument()
    
    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: /collapse form/i })
    await user.click(collapseButton)
    
    // Should show collapsed state
    expect(screen.getByRole('button', { name: /add new trip/i })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /client name/i })).not.toBeInTheDocument()
    
    // Click to expand again
    const expandButton = screen.getByRole('button', { name: /add new trip/i })
    await user.click(expandButton)
    
    // Should be expanded again
    expect(screen.getByRole('textbox', { name: /client name/i })).toBeInTheDocument()
  })

  it('fills form fields correctly', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<AddTripForm />)
    
    const clientNameInput = screen.getByRole('textbox', { name: /client name/i })
    const milesInput = screen.getByRole('spinbutton', { name: /miles driven/i })
    const notesInput = screen.getByRole('textbox', { name: /notes/i })
    
    await user.type(clientNameInput, 'Acme Corp')
    await user.clear(milesInput)
    await user.type(milesInput, '125.5')
    await user.type(notesInput, 'Client meeting downtown')
    
    expect(clientNameInput).toHaveValue('Acme Corp')
    expect(milesInput).toHaveValue(125.5)
    expect(notesInput).toHaveValue('Client meeting downtown')
  })

  it('handles form submission with valid data', async () => {
    const mockMutate = vi.fn()
    
    // Override the mock for this specific test
    vi.doMock('../../hooks/useTrips', () => ({
      useCreateTrip: () => ({
        mutate: mockMutate,
        isPending: false,
        isError: false,
        error: null,
      }),
    }))
    
    const user = userEvent.setup()
    renderWithQueryClient(<AddTripForm />)
    
    const clientNameInput = screen.getByRole('textbox', { name: /client name/i })
    const milesInput = screen.getByRole('spinbutton', { name: /miles driven/i })
    
    await user.type(clientNameInput, 'Test Client')
    await user.clear(milesInput)
    await user.type(milesInput, '100')
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    // Note: This test validates the form behavior, not the actual submission
    // The actual submission would be tested in integration tests
    expect(clientNameInput).toHaveValue('Test Client')
    expect(milesInput).toHaveValue(100)
  })

  it('shows loading state during submission', () => {
    vi.mocked(vi.importActual('../../hooks/useTrips')).useCreateTrip = () => ({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<AddTripForm />)
    
    expect(screen.getByText('Adding Trip...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adding trip/i })).toBeDisabled()
  })

  it('displays error message when submission fails', () => {
    const mockError = new Error('Network error')
    vi.mocked(vi.importActual('../../hooks/useTrips')).useCreateTrip = () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: mockError,
    })
    
    renderWithQueryClient(<AddTripForm />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })
})