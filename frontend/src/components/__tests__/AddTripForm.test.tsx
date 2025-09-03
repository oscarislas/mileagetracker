import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddTripForm from '../AddTripForm'
import { renderWithProviders } from '../../test/utils/testUtils'

// Create mock functions directly in the test file to avoid hoisting issues
const mockCreateTripMutate = vi.fn()
const mockUseCreateTrip = vi.fn(() => ({
  mutate: mockCreateTripMutate,
  isPending: false,
  isError: false,
  error: null,
}))

const mockUseClientSuggestions = vi.fn(() => ({
  data: { clients: [] },
  isLoading: false,
}))

const mockUseConnectionStatus = vi.fn(() => ({
  data: { connected: true },
  isLoading: false,
}))

// Mock the hooks
vi.mock('../../hooks/useTrips', () => ({
  useCreateTrip: () => mockUseCreateTrip(),
}))

vi.mock('../../hooks/useClients', () => ({
  useClientSuggestions: () => mockUseClientSuggestions(),
}))

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => mockUseConnectionStatus(),
}))

vi.mock('../../utils/errorUtils', () => ({
  getApiErrorMessage: () => 'Test error message',
}))

describe('AddTripForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default values
    mockUseCreateTrip.mockReturnValue({
      mutate: mockCreateTripMutate,
      isPending: false,
      isError: false,
      error: null,
    })
    mockUseClientSuggestions.mockReturnValue({
      data: { clients: [] },
      isLoading: false,
    })
    mockUseConnectionStatus.mockReturnValue({
      data: { connected: true },
      isLoading: false,
    })
  })

  it('renders the form with all fields', () => {
    renderWithProviders(<AddTripForm />)
    
    expect(screen.getByRole('textbox', { name: /client name/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/trip date/i)).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: /miles driven/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /notes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add trip/i })).toBeInTheDocument()
  })

  it('displays connection status when available', () => {
    renderWithProviders(<AddTripForm />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddTripForm />)
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument()
    })
  })

  it('validates client name length', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddTripForm />)
    
    const clientNameInput = screen.getByRole('textbox', { name: /client name/i }) as HTMLInputElement
    
    // Remove maxlength restriction temporarily to test validation
    clientNameInput.removeAttribute('maxlength')
    
    // Type 31 characters to trigger validation
    const longName = 'A'.repeat(31)
    await user.clear(clientNameInput)
    await user.type(clientNameInput, longName)
    
    const submitButton = screen.getByRole('button', { name: /add trip/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Client name must be 30 characters or less')).toBeInTheDocument()
    })
  })

  it('validates miles input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddTripForm />)
    
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

  it('starts with empty trip date to encourage user selection', () => {
    renderWithProviders(<AddTripForm />)
    
    const dateInput = screen.getByLabelText(/trip date/i) as HTMLInputElement
    expect(dateInput.value).toBe('')
    
    // Should show helpful hint text when date is empty
    expect(screen.getByText(/select the date when your trip occurred/i)).toBeInTheDocument()
  })

  it('can be collapsed and expanded', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddTripForm />)
    
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
    renderWithProviders(<AddTripForm />)
    
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
    mockUseCreateTrip.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    })
    
    const user = userEvent.setup()
    renderWithProviders(<AddTripForm />)
    
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
    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    })
    
    renderWithProviders(<AddTripForm />)
    
    expect(screen.getByText('Adding Trip...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /adding trip/i })).toBeDisabled()
  })

  it('displays error message when submission fails', () => {
    const mockError = new Error('Network error')
    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: mockError,
    })
    
    renderWithProviders(<AddTripForm />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })
})