import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TripsList from '../TripsList'

// Mock TripItem component
vi.mock('../TripItem', () => ({
  default: ({ trip, onEdit, onDelete }: any) => (
    <div data-testid={`trip-${trip.id}`}>
      <span>{trip.client_name}</span>
      <span>{trip.miles} miles</span>
      <button onClick={() => onEdit?.(trip)}>Edit</button>
      <button onClick={() => onDelete?.(trip.id)}>Delete</button>
    </div>
  ),
}))

// Mock hooks
const mockTripsData = {
  trips: [
    {
      id: 1,
      client_name: 'Acme Corp',
      trip_date: '2025-01-15',
      miles: 125.5,
      notes: 'Client meeting',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 2,
      client_name: 'Beta Inc',
      trip_date: '2025-01-14',
      miles: 75.0,
      notes: 'Site visit',
      created_at: '2025-01-14T14:30:00Z',
      updated_at: '2025-01-14T14:30:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
  total_pages: 1,
}

vi.mock('../../hooks/useTrips', () => ({
  useTrips: () => ({
    data: mockTripsData,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useUpdateTrip: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteTrip: () => ({
    mutate: vi.fn(),
    isPending: false,
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

describe('TripsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders trip items when data is available', () => {
    renderWithQueryClient(<TripsList />)
    
    expect(screen.getByTestId('trip-1')).toBeInTheDocument()
    expect(screen.getByTestId('trip-2')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
    expect(screen.getByText('125.5 miles')).toBeInTheDocument()
    expect(screen.getByText('75 miles')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<TripsList />)
    
    expect(screen.getByText('Loading trips...')).toBeInTheDocument()
    // Should show loading skeletons
    expect(screen.getAllByTestId(/loading-skeleton/)).toHaveLength(3)
  })

  it('displays error state with connection status', () => {
    const mockError = new Error('Cannot connect to server')
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    })
    
    vi.mocked(vi.importActual('../../hooks/useConnectionStatus')).useConnectionStatus = () => ({
      data: { connected: false },
    })
    
    renderWithQueryClient(<TripsList />)
    
    expect(screen.getByText('Failed to Load Trips')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText(/make sure the backend server is running/i)).toBeInTheDocument()
  })

  it('displays empty state when no trips exist', () => {
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: { ...mockTripsData, trips: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<TripsList />)
    
    expect(screen.getByText('No trips recorded yet')).toBeInTheDocument()
    expect(screen.getByText(/start tracking your business mileage/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your client name/i)).toBeInTheDocument()
  })

  it('shows pagination when multiple pages exist', () => {
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: { ...mockTripsData, total: 25, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<TripsList />)
    
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('handles pagination navigation', async () => {
    const user = userEvent.setup()
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: { ...mockTripsData, total: 25, total_pages: 3, page: 2 },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<TripsList />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    const prevButton = screen.getByRole('button', { name: /previous/i })
    
    expect(prevButton).toBeEnabled()
    expect(nextButton).toBeEnabled()
    
    await user.click(nextButton)
    // Would trigger a new query with page 3
    
    await user.click(prevButton)
    // Would trigger a new query with page 1
  })

  it('disables pagination buttons at boundaries', () => {
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: { ...mockTripsData, total: 25, total_pages: 3, page: 1 },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<TripsList />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    expect(prevButton).toBeDisabled()
    
    // Test last page
    vi.mocked(vi.importActual('../../hooks/useTrips')).useTrips = () => ({
      data: { ...mockTripsData, total: 25, total_pages: 3, page: 3 },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<TripsList />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
  })

  it('handles trip editing', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<TripsList />)
    
    const editButton = screen.getAllByText('Edit')[0]
    await user.click(editButton)
    
    // Should open edit modal/form
    // This would depend on the actual implementation
  })

  it('handles trip deletion with confirmation', async () => {
    const mockDeleteMutate = vi.fn()
    vi.mocked(vi.importActual('../../hooks/useTrips')).useDeleteTrip = () => ({
      mutate: mockDeleteMutate,
      isPending: false,
    })
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    const user = userEvent.setup()
    renderWithQueryClient(<TripsList />)
    
    const deleteButton = screen.getAllByText('Delete')[0]
    await user.click(deleteButton)
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this trip?')
    expect(mockDeleteMutate).toHaveBeenCalledWith(1)
    
    confirmSpy.mockRestore()
  })

  it('cancels deletion when user declines confirmation', async () => {
    const mockDeleteMutate = vi.fn()
    vi.mocked(vi.importActual('../../hooks/useTrips')).useDeleteTrip = () => ({
      mutate: mockDeleteMutate,
      isPending: false,
    })
    
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    const user = userEvent.setup()
    renderWithQueryClient(<TripsList />)
    
    const deleteButton = screen.getAllByText('Delete')[0]
    await user.click(deleteButton)
    
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    
    confirmSpy.mockRestore()
  })

  it('displays total count information', () => {
    renderWithQueryClient(<TripsList />)
    
    expect(screen.getByText('2 trips total')).toBeInTheDocument()
  })

  it('shows refresh functionality', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<TripsList />)
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)
    
    // Should trigger a refetch of trips data
  })
})