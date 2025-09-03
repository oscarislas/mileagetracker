import { render, type RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'
import type { ReactElement } from 'react'
import { AllTheProviders } from './TestProviders'

// Custom render function with React Query provider
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Mock data for tests
export const mockTripsResponse = {
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

export const mockSummaryResponse = {
  total_trips: 2,
  total_miles: 200.5,
  total_clients: 2,
  this_month: {
    trips: 2,
    miles: 200.5,
  },
  this_year: {
    trips: 2,
    miles: 200.5,
  },
}

export const mockClientSuggestionsResponse = {
  clients: ['Acme Corp', 'Beta Inc', 'Gamma LLC'],
}

// Mock functions for hooks
export const createMockHookReturns = () => ({
  useTrips: {
    data: mockTripsResponse,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  },
  useCreateTrip: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  },
  useUpdateTrip: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  },
  useDeleteTrip: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  },
  useConnectionStatus: {
    data: { connected: true },
    isLoading: false,
  },
  useClientSuggestions: {
    data: mockClientSuggestionsResponse,
    isLoading: false,
  },
  useSummary: {
    data: mockSummaryResponse,
    isLoading: false,
    isError: false,
  },
})

// Re-export testing library functions
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { createTestQueryClient } from './TestProviders'