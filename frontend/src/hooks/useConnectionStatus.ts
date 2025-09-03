import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import { getErrorMessage } from '../utils/errorUtils'

export function useConnectionStatus() {
  return useQuery({
    queryKey: ['connection-status'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/health', { timeout: 3000 })
        return { connected: true, status: response.status }
      } catch (error: unknown) {
        const message = getErrorMessage(error)
        console.warn('Connection check failed:', message)
        return { connected: false, error: message }
      }
    },
    retry: false, // Don't retry connection checks
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 0, // Always consider stale to get fresh connection status
    gcTime: 1000, // Short garbage collection time
  })
}