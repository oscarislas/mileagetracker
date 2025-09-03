import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import { isConnectionError, getHttpStatus } from '../utils/errorUtils'
import type { SummaryResponse } from '../types'

export function useSummary() {
  return useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<SummaryResponse>('/api/v1/trips/summary')
        return response.data
      } catch (error: unknown) {
        console.error('Failed to fetch summary:', error)
        // Re-throw with more context for better error handling
        if (isConnectionError(error)) {
          throw new Error('Cannot connect to server. Please ensure the backend is running.')
        }
        
        const status = getHttpStatus(error)
        if (status === 404) {
          throw new Error('Summary endpoint not found. Please check the API configuration.')
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}