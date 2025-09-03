import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import EnhancedTripsPage from '../../pages/EnhancedTripsPage'
import * as tripsHook from '../../hooks/useTrips'
import * as summaryHook from '../../hooks/useSummary'
import * as clientsHook from '../../hooks/useClients'

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

describe('EnhancedTripsPage Filter Functionality', () => {
  beforeEach(() => {
    mockUseTrips.mockReturnValue({
      data: mockTripsData,
      isLoading: false,
      isError: false,
      error: null
    })
    
    mockUseSummary.mockReturnValue({
      data: mockSummaryData,
      isLoading: false,
      isError: false,
      error: null
    })
    
    mockUseAllClients.mockReturnValue({
      data: mockClientsData,
      isLoading: false,
      isError: false,
      error: null
    })
    
    mockUseClientSuggestions.mockReturnValue({
      data: { clients: [] },
      isLoading: false,
      isError: false,
      error: null
    })
    
    mockUseCreateTrip.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
      error: null
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('renders filter panel when filters button is clicked', () => {
    renderWithQueryClient(<EnhancedTripsPage />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    fireEvent.click(filtersButton)
    
    expect(screen.getByText('Filter Trips')).toBeInTheDocument()
    expect(screen.getByLabelText('Date Range')).toBeInTheDocument()
    expect(screen.getByLabelText('Client')).toBeInTheDocument()
    expect(screen.getByLabelText('Miles Range')).toBeInTheDocument()
  })

  test('populates client dropdown with fetched clients', () => {
    renderWithQueryClient(<EnhancedTripsPage />)
    
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
    renderWithQueryClient(<EnhancedTripsPage />)
    
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
      
      expect(filters.dateRange).toBe('month')
      expect(filters.clientFilter).toBe('Test Client')
      expect(filters.milesRange).toBe('10-50')
    })
  })

  test('clears all filters when Clear All button is clicked', async () => {
    renderWithQueryClient(<EnhancedTripsPage />)
    
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
    renderWithQueryClient(<EnhancedTripsPage />)
    
    const searchInput = screen.getByPlaceholderText(/search trips, clients/i)
    fireEvent.change(searchInput, { target: { value: 'test search' } })
    
    // Wait for debounce
    await waitFor(() => {
      const lastCall = mockUseTrips.mock.calls[mockUseTrips.mock.calls.length - 1]
      const filters = lastCall[2]
      expect(filters.searchQuery).toBe('test search')
    }, { timeout: 1000 })
  })

  test('displays filtered trips count when filters are applied', async () => {
    renderWithQueryClient(<EnhancedTripsPage />)
    
    // Set a search query to trigger filters
    const searchInput = screen.getByPlaceholderText(/search trips, clients/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(screen.getByText('Filtered Trips')).toBeInTheDocument()
      expect(screen.getByText('1 results')).toBeInTheDocument()
    })
  })
})