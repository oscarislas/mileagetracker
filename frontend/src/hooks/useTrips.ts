import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import { isConnectionError, getHttpStatus } from '../utils/errorUtils'
import type { TripsResponse, CreateTripRequest, UpdateTripRequest, Trip, MessageResponse } from '../types'

export function useTrips(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['trips', page, limit],
    queryFn: async () => {
      try {
        const response = await apiClient.get<TripsResponse>('/api/v1/trips', {
          params: { page, limit }
        })
        return response.data
      } catch (error: unknown) {
        console.error('Failed to fetch trips:', error)
        // Re-throw with more context for better error handling
        if (isConnectionError(error)) {
          throw new Error('Cannot connect to server. Please ensure the backend is running.')
        }
        
        const status = getHttpStatus(error)
        if (status === 404) {
          throw new Error('Trips endpoint not found. Please check the API configuration.')
        } else if (status && status >= 500) {
          throw new Error('Server error occurred. Please try again later.')
        }
        
        throw error
      }
    },
    retry: (failureCount, error: Error) => {
      // Don't retry on connection errors or 404s
      if (error.message.includes('Cannot connect to server') || 
          error.message.includes('endpoint not found')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateTripRequest) => {
      const response = await apiClient.post<Trip>('/api/v1/trips', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    }
  })
}

export function useUpdateTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTripRequest }) => {
      const response = await apiClient.put<Trip>(`/api/v1/trips/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    }
  })
}

export function useDeleteTrip() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete<MessageResponse>(`/api/v1/trips/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      queryClient.invalidateQueries({ queryKey: ['summary'] })
    }
  })
}