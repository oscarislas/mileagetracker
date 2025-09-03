import { vi } from 'vitest'
import { createMockHookReturns } from './testUtils'

// Create centralized mock implementations for all hooks
const mockReturns = createMockHookReturns()

// Mock implementations that can be used across tests
// These need to be created outside of mock calls to avoid hoisting issues
export const mockUseTrips = vi.fn()
export const mockUseCreateTrip = vi.fn()
export const mockUseUpdateTrip = vi.fn()
export const mockUseDeleteTrip = vi.fn()
export const mockUseConnectionStatus = vi.fn()
export const mockUseClientSuggestions = vi.fn()
export const mockUseSummary = vi.fn()

// Initialize default return values
mockUseTrips.mockReturnValue(mockReturns.useTrips)
mockUseCreateTrip.mockReturnValue(mockReturns.useCreateTrip)
mockUseUpdateTrip.mockReturnValue(mockReturns.useUpdateTrip)
mockUseDeleteTrip.mockReturnValue(mockReturns.useDeleteTrip)
mockUseConnectionStatus.mockReturnValue(mockReturns.useConnectionStatus)
mockUseClientSuggestions.mockReturnValue(mockReturns.useClientSuggestions)
mockUseSummary.mockReturnValue(mockReturns.useSummary)

// Helper to reset all mocks to their default values
export const resetAllMocks = () => {
  const freshMockReturns = createMockHookReturns()
  mockUseTrips.mockReturnValue(freshMockReturns.useTrips)
  mockUseCreateTrip.mockReturnValue(freshMockReturns.useCreateTrip)
  mockUseUpdateTrip.mockReturnValue(freshMockReturns.useUpdateTrip)
  mockUseDeleteTrip.mockReturnValue(freshMockReturns.useDeleteTrip)
  mockUseConnectionStatus.mockReturnValue(freshMockReturns.useConnectionStatus)
  mockUseClientSuggestions.mockReturnValue(freshMockReturns.useClientSuggestions)
  mockUseSummary.mockReturnValue(freshMockReturns.useSummary)
}

// Helper to set loading state
export const setLoadingState = () => {
  mockUseTrips.mockReturnValue({
    ...mockReturns.useTrips,
    isLoading: true,
    data: undefined,
  })
}

// Helper to set error state
export const setErrorState = (error: Error) => {
  mockUseTrips.mockReturnValue({
    ...mockReturns.useTrips,
    isLoading: false,
    isError: true,
    error,
    data: undefined,
  })
}

// Helper to set empty state
export const setEmptyState = () => {
  mockUseTrips.mockReturnValue({
    ...mockReturns.useTrips,
    data: {
      trips: [],
      total: 0,
      page: 1,
      limit: 10,
      total_pages: 0,
    },
  })
}

// Helper to set disconnected state
export const setDisconnectedState = () => {
  mockUseConnectionStatus.mockReturnValue({
    data: { connected: false },
    isLoading: false,
  })
}