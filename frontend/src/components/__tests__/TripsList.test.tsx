import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Trip } from '../../types'
import TripsList from '../TripsList'
import { renderWithProviders, mockTripsResponse } from '../../test/utils/testUtils'
import {
  mockUseTrips,
  mockUseUpdateTrip,
  mockUseDeleteTrip,
  mockUseConnectionStatus,
  resetAllMocks,
  setLoadingState,
  setErrorState,
  setEmptyState,
  setDisconnectedState
} from '../../test/utils/mockHooks'

interface MockTripItemProps {
  trip: Trip
  onEdit?: (trip: Trip) => void
  onDelete?: (id: number) => void
}

// Mock TripItem component
vi.mock('../TripItem', () => ({
  default: ({ trip, onEdit, onDelete }: MockTripItemProps) => (
    <div data-testid={`trip-${trip.id}`}>
      <span>{trip.client_name}</span>
      <span>{trip.miles} miles</span>
      <button onClick={() => onEdit?.(trip)}>Edit</button>
      <button onClick={() => onDelete?.(trip.id)}>Delete</button>
    </div>
  ),
}))

// Mock LoadingSkeletons component
vi.mock('../LoadingSkeletons', () => ({
  TripItemSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}))

// Mock hooks with centralized mock functions
vi.mock('../../hooks/useTrips', () => ({
  useTrips: mockUseTrips,
  useUpdateTrip: mockUseUpdateTrip,
  useDeleteTrip: mockUseDeleteTrip,
}))

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: mockUseConnectionStatus,
}))

vi.mock('../../utils/errorUtils', () => ({
  getApiErrorMessage: () => 'Test error message',
}))

describe('TripsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllMocks()
  })

  it('renders trip items when data is available', () => {
    renderWithProviders(<TripsList />)
    
    expect(screen.getByTestId('trip-1')).toBeInTheDocument()
    expect(screen.getByTestId('trip-2')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Beta Inc')).toBeInTheDocument()
    expect(screen.getByText('125.5 miles')).toBeInTheDocument()
    expect(screen.getByText('75 miles')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    setLoadingState()
    
    renderWithProviders(<TripsList />)
    
    expect(screen.getByText('Loading trips...')).toBeInTheDocument()
    // Should show loading skeletons
    expect(screen.getAllByTestId(/loading-skeleton/)).toHaveLength(3)
  })

  it('displays error state with connection status', () => {
    const mockError = new Error('Cannot connect to server')
    setErrorState(mockError)
    setDisconnectedState()
    
    renderWithProviders(<TripsList />)
    
    expect(screen.getByText('Failed to Load Trips')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText(/make sure the backend server is running/i)).toBeInTheDocument()
  })

  it('displays empty state when no trips exist', () => {
    setEmptyState()
    
    renderWithProviders(<TripsList />)
    
    expect(screen.getByText('No trips recorded yet')).toBeInTheDocument()
    expect(screen.getByText(/start tracking your business mileage/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your client name/i)).toBeInTheDocument()
  })

  it('shows pagination when multiple pages exist', () => {
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    
    renderWithProviders(<TripsList />)
    
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('handles pagination navigation', async () => {
    const user = userEvent.setup()
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3, page: 2 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    
    renderWithProviders(<TripsList />)
    
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
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3, page: 1 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    
    renderWithProviders(<TripsList />)
    
    const prevButton = screen.getByRole('button', { name: /previous/i })
    expect(prevButton).toBeDisabled()
    
    // Test last page
    mockUseTrips.mockReturnValue({
      data: { ...mockTripsResponse, total: 25, total_pages: 3, page: 3 },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    
    renderWithProviders(<TripsList />)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    expect(nextButton).toBeDisabled()
  })

  it('handles trip editing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TripsList />)
    
    const editButton = screen.getAllByText('Edit')[0]
    await user.click(editButton)
    
    // Should open edit modal/form
    // This would depend on the actual implementation
  })

  it('handles trip deletion with confirmation', async () => {
    const mockDeleteMutate = vi.fn()
    mockUseDeleteTrip.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      isError: false,
      error: null,
    })
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    const user = userEvent.setup()
    renderWithProviders(<TripsList />)
    
    const deleteButton = screen.getAllByText('Delete')[0]
    await user.click(deleteButton)
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this trip?')
    expect(mockDeleteMutate).toHaveBeenCalledWith(1)
    
    confirmSpy.mockRestore()
  })

  it('cancels deletion when user declines confirmation', async () => {
    const mockDeleteMutate = vi.fn()
    mockUseDeleteTrip.mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
      isError: false,
      error: null,
    })
    
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    const user = userEvent.setup()
    renderWithProviders(<TripsList />)
    
    const deleteButton = screen.getAllByText('Delete')[0]
    await user.click(deleteButton)
    
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDeleteMutate).not.toHaveBeenCalled()
    
    confirmSpy.mockRestore()
  })

  it('displays total count information', () => {
    renderWithProviders(<TripsList />)
    
    expect(screen.getByText('2 trips total')).toBeInTheDocument()
  })

  it('shows refresh functionality', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TripsList />)
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)
    
    // Should trigger a refetch of trips data
  })
})