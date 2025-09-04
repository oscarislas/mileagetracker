import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TripDetailModal from '../TripDetailModal'
import type { Trip } from '../../types'

const mockTrip: Trip = {
  id: 1,
  client_name: 'Test Client',
  trip_date: '2025-09-03',
  miles: 25.5,
  notes: 'Test trip notes',
  created_at: '2025-09-03T10:00:00Z',
  updated_at: '2025-09-03T10:00:00Z'
}

const createTestQueryClient = () => 
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('TripDetailModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders nothing when trip is null', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={null} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    expect(screen.queryByText('Trip Details')).not.toBeInTheDocument()
  })

  it('renders in view mode by default', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    expect(screen.getByText('Test Client')).toBeInTheDocument()
    expect(screen.getByText('Trip Details')).toBeInTheDocument()
    expect(screen.getByText('25.5 miles')).toBeInTheDocument()
    expect(screen.getByText('Test trip notes')).toBeInTheDocument()
    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('shows estimated deduction correctly', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    const expectedDeduction = (25.5 * 0.67).toFixed(2)
    expect(screen.getByText(`$${expectedDeduction}`)).toBeInTheDocument()
  })

  it('switches to edit mode when edit button is clicked', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    fireEvent.click(screen.getByText('Edit Trip'))
    
    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
    expect(screen.getByText('Update trip information')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025-09-03')).toBeInTheDocument()
    expect(screen.getByDisplayValue('25.5')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test trip notes')).toBeInTheDocument()
  })

  it('shows delete confirmation when delete button is clicked', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    fireEvent.click(screen.getByText('Delete'))
    
    expect(screen.getByText('Delete Trip?')).toBeInTheDocument()
    expect(screen.getByText(/This will permanently remove the trip to/)).toBeInTheDocument()
    expect(screen.getByText('Test Client')).toBeInTheDocument()
    expect(screen.getByText('Delete Trip')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('handles form validation in edit mode', async () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Trip'))
    
    // Clear required fields
    const clientInput = screen.getByDisplayValue('Test Client')
    const milesInput = screen.getByDisplayValue('25.5')
    
    fireEvent.change(clientInput, { target: { value: '' } })
    fireEvent.change(milesInput, { target: { value: '0' } })
    
    // Try to save
    fireEvent.click(screen.getByText('Save Changes'))
    
    await waitFor(() => {
      expect(screen.getByText('Client name is required')).toBeInTheDocument()
      expect(screen.getByText('Miles must be greater than 0')).toBeInTheDocument()
    })
  })

  it('cancels edit mode and reverts changes', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    )

    // Switch to edit mode
    fireEvent.click(screen.getByText('Edit Trip'))
    
    // Make changes
    const clientInput = screen.getByDisplayValue('Test Client')
    fireEvent.change(clientInput, { target: { value: 'Modified Client' } })
    
    // Cancel
    fireEvent.click(screen.getByText('Cancel'))
    
    // Should be back in view mode with original data
    expect(screen.getByText('Test Client')).toBeInTheDocument()
    expect(screen.queryByText('Modified Client')).not.toBeInTheDocument()
    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
  })

  it('initializes in edit mode when initialMode is edit', () => {
    renderWithProviders(
      <TripDetailModal 
        trip={mockTrip} 
        isOpen={true} 
        onClose={mockOnClose} 
        initialMode="edit"
      />
    )

    expect(screen.getByText('Edit Trip')).toBeInTheDocument()
    expect(screen.getByText('Update trip information')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Client')).toBeInTheDocument()
  })
})