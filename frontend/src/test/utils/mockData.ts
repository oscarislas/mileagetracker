import { vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

// Mock data for tests
export const mockTripsResponse = {
  trips: [
    {
      id: 1,
      client_name: "Acme Corp",
      trip_date: "2025-01-15",
      miles: 125.5,
      notes: "Client meeting",
      created_at: "2025-01-15T10:00:00Z",
      updated_at: "2025-01-15T10:00:00Z",
    },
    {
      id: 2,
      client_name: "Beta Inc",
      trip_date: "2025-01-14",
      miles: 75.0,
      notes: "Site visit",
      created_at: "2025-01-14T14:30:00Z",
      updated_at: "2025-01-14T14:30:00Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
  total_pages: 1,
};

export const mockSummaryResponse = {
  months: [
    {
      month: "January 2025",
      year: 2025,
      month_num: 1,
      total_miles: 200.5,
      amount: 134.53,
    },
  ],
};

export const mockClientSuggestionsResponse = {
  clients: [
    { id: 1, name: "Acme Corp", created_at: "2025-01-01T00:00:00Z" },
    { id: 2, name: "Beta Inc", created_at: "2025-01-01T00:00:00Z" },
    { id: 3, name: "Gamma LLC", created_at: "2025-01-01T00:00:00Z" },
  ],
};

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
});

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};
