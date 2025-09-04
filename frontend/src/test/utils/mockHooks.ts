import { vi } from 'vitest'
import { createMockHookReturns } from './mockData'

// Get default mock returns
const defaultMocks = createMockHookReturns()

// Mock hook implementations that can be overridden in tests
export const mockUseTrips = vi.fn(() => defaultMocks.useTrips)
export const mockUseCreateTrip = vi.fn(() => defaultMocks.useCreateTrip)
export const mockUseUpdateTrip = vi.fn(() => defaultMocks.useUpdateTrip)
export const mockUseDeleteTrip = vi.fn(() => defaultMocks.useDeleteTrip)
export const mockUseConnectionStatus = vi.fn(() => defaultMocks.useConnectionStatus)
export const mockUseClientSuggestions = vi.fn(() => defaultMocks.useClientSuggestions)
export const mockUseSummary = vi.fn(() => defaultMocks.useSummary)

// Helper function to reset all mocks to defaults
export const resetMockHooks = () => {
  const fresh = createMockHookReturns()
  mockUseTrips.mockReturnValue(fresh.useTrips)
  mockUseCreateTrip.mockReturnValue(fresh.useCreateTrip)
  mockUseUpdateTrip.mockReturnValue(fresh.useUpdateTrip)
  mockUseDeleteTrip.mockReturnValue(fresh.useDeleteTrip)
  mockUseConnectionStatus.mockReturnValue(fresh.useConnectionStatus)
  mockUseClientSuggestions.mockReturnValue(fresh.useClientSuggestions)
  mockUseSummary.mockReturnValue(fresh.useSummary)
}

// Alias for compatibility with existing tests
export const resetAllMocks = resetMockHooks

// Helper function to clear all mocks
export const clearMockHooks = () => {
  mockUseTrips.mockClear()
  mockUseCreateTrip.mockClear()
  mockUseUpdateTrip.mockClear()
  mockUseDeleteTrip.mockClear()
  mockUseConnectionStatus.mockClear()
  mockUseClientSuggestions.mockClear()
  mockUseSummary.mockClear()
}

// Setup function to configure all mocks at once
export const setupMockHooks = () => {
  vi.doMock('../../hooks/useTrips', () => ({
    useTrips: mockUseTrips,
    useCreateTrip: mockUseCreateTrip,
    useUpdateTrip: mockUseUpdateTrip,
    useDeleteTrip: mockUseDeleteTrip,
  }))

  vi.doMock('../../hooks/useClients', () => ({
    useClientSuggestions: mockUseClientSuggestions,
  }))

  vi.doMock('../../hooks/useConnectionStatus', () => ({
    useConnectionStatus: mockUseConnectionStatus,
  }))

  vi.doMock('../../hooks/useSummary', () => ({
    useSummary: mockUseSummary,
  }))

  vi.doMock('../../utils/errorUtils', () => ({
    getApiErrorMessage: vi.fn(() => 'Test error message'),
    isAxiosError: vi.fn(() => false),
  }))
}