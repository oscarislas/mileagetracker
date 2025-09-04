import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";
import { isConnectionError, getHttpStatus } from "../utils/errorUtils";
import type {
  TripsResponse,
  CreateTripRequest,
  UpdateTripRequest,
  Trip,
  MessageResponse,
  TripsQueryParams,
  TripFilters,
  DateRangeFilter,
} from "../types";

// Helper function to convert date range filter to actual dates
function getDateRange(dateRange: DateRangeFilter): {
  date_from?: string;
  date_to?: string;
} {
  if (!dateRange) return {};

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const date = today.getDate();

  switch (dateRange) {
    case "today": {
      const todayStr = today.toISOString().split("T")[0];
      return { date_from: todayStr, date_to: todayStr };
    }

    case "week": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(date - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        date_from: startOfWeek.toISOString().split("T")[0],
        date_to: endOfWeek.toISOString().split("T")[0],
      };
    }

    case "month": {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      return {
        date_from: startOfMonth.toISOString().split("T")[0],
        date_to: endOfMonth.toISOString().split("T")[0],
      };
    }

    case "quarter": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const startOfQuarter = new Date(year, quarterStartMonth, 1);
      const endOfQuarter = new Date(year, quarterStartMonth + 3, 0);
      return {
        date_from: startOfQuarter.toISOString().split("T")[0],
        date_to: endOfQuarter.toISOString().split("T")[0],
      };
    }

    default:
      return {};
  }
}

// Helper function to convert miles range filter to min/max values
function getMilesRange(milesRange: string): {
  min_miles?: number;
  max_miles?: number;
} {
  if (!milesRange) return {};

  switch (milesRange) {
    case "0-10":
      return { min_miles: 0, max_miles: 10 };
    case "10-50":
      return { min_miles: 10, max_miles: 50 };
    case "50-100":
      return { min_miles: 50, max_miles: 100 };
    case "100+":
      return { min_miles: 100 };
    default:
      return {};
  }
}

export function useTrips(page = 1, limit = 10, filters?: TripFilters) {
  return useQuery({
    queryKey: ["trips", page, limit, filters],
    queryFn: async () => {
      try {
        const params: TripsQueryParams = { page, limit };

        if (filters) {
          // Add search query
          if (filters.searchQuery.trim()) {
            params.search = filters.searchQuery.trim();
          }

          // Add client filter
          if (filters.clientFilter.trim()) {
            params.client = filters.clientFilter.trim();
          }

          // Add date range filters
          const dateRange = getDateRange(filters.dateRange);
          if (dateRange.date_from) params.date_from = dateRange.date_from;
          if (dateRange.date_to) params.date_to = dateRange.date_to;

          // Add miles range filters
          const milesRange = getMilesRange(filters.milesRange);
          if (milesRange.min_miles !== undefined)
            params.min_miles = milesRange.min_miles;
          if (milesRange.max_miles !== undefined)
            params.max_miles = milesRange.max_miles;
        }

        const response = await apiClient.get<TripsResponse>("/api/v1/trips", {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        console.error("Failed to fetch trips:", error);
        // Re-throw with more context for better error handling
        if (isConnectionError(error)) {
          throw new Error(
            "Cannot connect to server. Please ensure the backend is running.",
          );
        }

        const status = getHttpStatus(error);
        if (status === 404) {
          throw new Error(
            "Trips endpoint not found. Please check the API configuration.",
          );
        } else if (status && status >= 500) {
          throw new Error("Server error occurred. Please try again later.");
        }

        throw error;
      }
    },
    retry: (failureCount, error: Error) => {
      // Don't retry on connection errors or 404s
      if (
        error.message.includes("Cannot connect to server") ||
        error.message.includes("endpoint not found")
      ) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTripRequest) => {
      const response = await apiClient.post<Trip>("/api/v1/trips", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateTripRequest;
    }) => {
      const response = await apiClient.put<Trip>(`/api/v1/trips/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<MessageResponse>(
        `/api/v1/trips/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });
}
