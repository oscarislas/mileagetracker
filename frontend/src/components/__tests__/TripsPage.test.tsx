import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { vi } from 'vitest'
import TripsPage from '../../pages/TripsPage'
import * as tripsHook from '../../hooks/useTrips'
import * as summaryHook from '../../hooks/useSummary'
import * as clientsHook from '../../hooks/useClients'
import type { TripsResponse, SummaryResponse, ClientSuggestionsResponse, CreateTripRequest, MessageResponse } from '../../types'

// Mock the hooks
vi.mock('../../hooks/useTrips')
vi.mock('../../hooks/useSummary')  
vi.mock('../../hooks/useClients')

const mockUseTrips = vi.mocked(tripsHook.useTrips)
const mockUseSummary = vi.mocked(summaryHook.useSummary)
const mockUseAllClients = vi.mocked(clientsHook.useAllClients)
const mockUseClientSuggestions = vi.mocked(clientsHook.useClientSuggestions)
const mockUseCreateTrip = vi.mocked(tripsHook.useCreateTrip)

const mockTripsData = {
  trips: [
    {
      id: 1,
      client_name: 'Test Client',
      trip_date: '2025-01-15',
      miles: 25.5,
      notes: 'Test trip',
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    }
  ],
  total: 1,
  page: 1,
  limit: 10,
  total_pages: 1
}

const mockSummaryData = {
  months: [
    {
      month: 'January 2025',
      year: 2025,
      month_num: 1,
      total_miles: 100,
      amount: 67
    }
  ]
}

const mockClientsData = {
  clients: [
    { id: 1, name: 'Test Client', created_at: '2025-01-01T00:00:00Z' },
    { id: 2, name: 'Another Client', created_at: '2025-01-01T00:00:00Z' }
  ]
}

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('TripsPage', () => {
  beforeEach(() => {
    mockUseTrips.mockReturnValue({
      data: mockTripsData,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<TripsResponse>)
    
    mockUseSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<SummaryResponse>)
    
    mockUseAllClients.mockReturnValue({
      data: mockClientsData,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<ClientSuggestionsResponse>)
    
    mockUseClientSuggestions.mockReturnValue({
      data: { clients: [] },
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<ClientSuggestionsResponse>)
    
    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isIdle: true,
      isSuccess: false,
      error: null,
      data: undefined,
      failureCount: 0,
      failureReason: null,
      mutateAsync: vi.fn(),
      reset: vi.fn(),
      status: 'idle',
      submittedAt: 0,
      variables: undefined,
      context: undefined
    } as UseMutationResult<MessageResponse, Error, CreateTripRequest>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders filter panel when filters button is clicked', () => {
    renderWithQueryClient(<TripsPage />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    expect(screen.getByText('Filter Trips')).toBeInTheDocument()
    expect(screen.getByLabelText('Date Range')).toBeInTheDocument()
    expect(screen.getByLabelText('Client')).toBeInTheDocument()
    expect(screen.getByLabelText('Miles Range')).toBeInTheDocument()
  })

  test('populates client dropdown with fetched clients', () => {
    renderWithQueryClient(<TripsPage />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const clientSelect = screen.getByLabelText('Client')
    expect(clientSelect).toBeInTheDocument()
    
    // Check that client options are populated by finding options specifically
    const testClientOption = screen.getByRole('option', { name: 'Test Client' })
    const anotherClientOption = screen.getByRole('option', { name: 'Another Client' })
    
    expect(testClientOption).toBeInTheDocument()
    expect(anotherClientOption).toBeInTheDocument()
  })

  test('applies filters when Apply Filters button is clicked', async () => {
    renderWithQueryClient(<TripsPage />)
    
    // Open filters
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    // Select filters
    const dateRangeSelect = screen.getByLabelText('Date Range')
    fireEvent.change(dateRangeSelect, { target: { value: 'month' } })
    
    const clientSelect = screen.getByLabelText('Client')
    fireEvent.change(clientSelect, { target: { value: 'Test Client' } })
    
    const milesRangeSelect = screen.getByLabelText('Miles Range')
    fireEvent.change(milesRangeSelect, { target: { value: '10-50' } })
    
    // Apply filters
    const applyButton = screen.getByRole('button', { name: /apply filters/i })
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      // Verify that useTrips was called with the correct filters
      const lastCall = mockUseTrips.mock.calls[mockUseTrips.mock.calls.length - 1]
      const filters = lastCall[2] // Third parameter is filters
      
      expect(filters?.dateRange).toBe('month')
      expect(filters?.clientFilter).toBe('Test Client')
      expect(filters?.milesRange).toBe('10-50')
    })
  })

  test('clears all filters when Clear All button is clicked', async () => {
    renderWithQueryClient(<TripsPage />)
    
    // Open filters and set some values
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    const dateRangeSelect = screen.getByLabelText('Date Range')
    fireEvent.change(dateRangeSelect, { target: { value: 'month' } })
    
    // Clear all
    const clearButton = screen.getByRole('button', { name: /clear all/i })
    fireEvent.click(clearButton)
    
    await waitFor(() => {
      expect(dateRangeSelect).toHaveValue('')
    })
  })

  test('updates search query in real-time', async () => {
    renderWithQueryClient(<TripsPage />)
    
    const searchInput = screen.getByPlaceholderText(/search trips, clients/i)
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    // Wait for debounce
    await waitFor(() => {
      const lastCall = mockUseTrips.mock.calls[mockUseTrips.mock.calls.length - 1]
      const filters = lastCall[2]
      expect(filters?.searchQuery).toBe('test search')
    }, { timeout: 1000 })
  })

  test('displays filtered trips heading when filters are applied', async () => {
    renderWithQueryClient(<TripsPage />)
    
    // Set a search query to trigger filters
    const searchInput = screen.getByPlaceholderText(/search trips, clients/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(screen.getByText('Filtered Trips')).toBeInTheDocument()
      // The "1 total" text comes from TripsList component, not the main page
      expect(screen.getByText('1 total')).toBeInTheDocument()
    })
  })

  test('displays total trips count from trips data, not summary data', () => {
    // Mock trips data with specific total count
    const mockTripsDataWithTotal = {
      ...mockTripsData,
      total: 11 // This should be displayed
    }
    
    // Mock summary data without total_trips (which doesn't exist in the API)
    const mockSummaryWithoutTotal = {
      months: [
        {
          month: 'January 2025',
          year: 2025,
          month_num: 1,
          total_miles: 100,
          amount: 67
        }
      ]
      // Note: no total_trips property - this is correct per the API spec
    }
    
    mockUseTrips.mockReturnValue({
      data: mockTripsDataWithTotal,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<TripsResponse>)
    
    mockUseSummary.mockReturnValue({
      data: mockSummaryWithoutTotal,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<SummaryResponse>)
    
    renderWithQueryClient(<TripsPage />)
    
    // Verify that the total trips count comes from tripsData.total, not summaryData.total_trips
    expect(screen.getByText('11')).toBeInTheDocument()
    expect(screen.getByText('Total Trips')).toBeInTheDocument()
  })
  
  test('displays 0 total trips when trips data is not loaded', () => {
    mockUseTrips.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<TripsResponse>)
    
    mockUseSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null,
      isPending: false,
      isSuccess: true,
      isLoadingError: false,
      isRefetchError: false,
      status: 'success',
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isStale: false,
      refetch: vi.fn(),
      remove: vi.fn(),
      fetchStatus: 'idle' as const,
      isPlaceholderData: false,
      isPreviousData: false,
      isInitialLoading: false
    } as UseQueryResult<SummaryResponse>)
    
    renderWithQueryClient(<TripsPage />)
    
    // Should display 0 when trips data is null/undefined
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Total Trips')).toBeInTheDocument()
  })
  
  test('calls useTrips hook with minimal parameters for total count', () => {
    renderWithQueryClient(<TripsPage />)
    
    // Verify that useTrips is called with (1, 1) to get just the total count efficiently
    // This should be the first call (for the stats overview)
    expect(mockUseTrips).toHaveBeenNthCalledWith(1, 1, 1)
    // There will also be a second call from TripsList component with different parameters
    expect(mockUseTrips).toHaveBeenCalledTimes(2)
  })
})