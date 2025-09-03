import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../services/apiClient'
import type { ClientSuggestionsResponse } from '../types'

export function useClientSuggestions(query: string) {
  return useQuery({
    queryKey: ['clients', query],
    queryFn: async () => {
      if (!query.trim()) return { clients: [] }
      
      const response = await apiClient.get<ClientSuggestionsResponse>('/api/v1/clients', {
        params: { q: query }
      })
      return response.data
    },
    enabled: query.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}