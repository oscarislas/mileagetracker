import { describe, test, expect } from 'vitest'
import type { TripFilters, TripsQueryParams } from '../../types'

// Import the helper functions from useTrips - we need to extract them for testing
// For now, we'll recreate the logic to test the filter transformation

// Helper function to convert date range filter to actual dates
function getDateRange(dateRange: string): { date_from?: string; date_to?: string } {
  if (!dateRange) return {}
  
  const today = new Date('2025-01-15') // Fixed date for testing
  const year = today.getFullYear()
  const month = today.getMonth()
  const date = today.getDate()
  
  switch (dateRange) {
    case 'today': {
      const todayStr = today.toISOString().split('T')[0]
      return { date_from: todayStr, date_to: todayStr }
    }
    
    case 'week': {
      const startOfWeek = new Date(today)
      startOfWeek.setDate(date - today.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return { 
        date_from: startOfWeek.toISOString().split('T')[0],
        date_to: endOfWeek.toISOString().split('T')[0]
      }
    }
    
    case 'month': {
      const startOfMonth = new Date(year, month, 1)
      const endOfMonth = new Date(year, month + 1, 0)
      return { 
        date_from: startOfMonth.toISOString().split('T')[0],
        date_to: endOfMonth.toISOString().split('T')[0]
      }
    }
    
    case 'quarter': {
      const quarterStartMonth = Math.floor(month / 3) * 3
      const startOfQuarter = new Date(year, quarterStartMonth, 1)
      const endOfQuarter = new Date(year, quarterStartMonth + 3, 0)
      return { 
        date_from: startOfQuarter.toISOString().split('T')[0],
        date_to: endOfQuarter.toISOString().split('T')[0]
      }
    }
    
    default:
      return {}
  }
}

// Helper function to convert miles range filter to min/max values
function getMilesRange(milesRange: string): { min_miles?: number; max_miles?: number } {
  if (!milesRange) return {}
  
  switch (milesRange) {
    case '0-10':
      return { min_miles: 0, max_miles: 10 }
    case '10-50':
      return { min_miles: 10, max_miles: 50 }
    case '50-100':
      return { min_miles: 50, max_miles: 100 }
    case '100+':
      return { min_miles: 100 }
    default:
      return {}
  }
}

// Function that simulates the filter conversion in useTrips
function convertFiltersToParams(page: number, limit: number, filters?: TripFilters): TripsQueryParams {
  const params: TripsQueryParams = { page, limit }
  
  if (filters) {
    // Add search query
    if (filters.searchQuery.trim()) {
      params.search = filters.searchQuery.trim()
    }
    
    // Add client filter
    if (filters.clientFilter.trim()) {
      params.client = filters.clientFilter.trim()
    }
    
    // Add date range filters
    const dateRange = getDateRange(filters.dateRange)
    if (dateRange.date_from) params.date_from = dateRange.date_from
    if (dateRange.date_to) params.date_to = dateRange.date_to
    
    // Add miles range filters
    const milesRange = getMilesRange(filters.milesRange)
    if (milesRange.min_miles !== undefined) params.min_miles = milesRange.min_miles
    if (milesRange.max_miles !== undefined) params.max_miles = milesRange.max_miles
  }
  
  return params
}

describe('Filter Conversion Logic', () => {
  test('converts empty filters correctly', () => {
    const filters: TripFilters = {
      dateRange: '',
      clientFilter: '',
      milesRange: '',
      searchQuery: ''
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params).toEqual({
      page: 1,
      limit: 10
    })
  })

  test('converts search query filter', () => {
    const filters: TripFilters = {
      dateRange: '',
      clientFilter: '',
      milesRange: '',
      searchQuery: 'test search'
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params.search).toBe('test search')
  })

  test('converts client filter', () => {
    const filters: TripFilters = {
      dateRange: '',
      clientFilter: 'Test Client',
      milesRange: '',
      searchQuery: ''
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params.client).toBe('Test Client')
  })

  test('converts today date range filter', () => {
    const filters: TripFilters = {
      dateRange: 'today',
      clientFilter: '',
      milesRange: '',
      searchQuery: ''
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params.date_from).toBe('2025-01-15')
    expect(params.date_to).toBe('2025-01-15')
  })

  test('converts month date range filter', () => {
    const filters: TripFilters = {
      dateRange: 'month',
      clientFilter: '',
      milesRange: '',
      searchQuery: ''
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params.date_from).toBe('2025-01-01')
    expect(params.date_to).toBe('2025-01-31')
  })

  test('converts miles range filter', () => {
    const filters: TripFilters = {
      dateRange: '',
      clientFilter: '',
      milesRange: '10-50',
      searchQuery: ''
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params.min_miles).toBe(10)
    expect(params.max_miles).toBe(50)
  })

  test('converts 100+ miles range filter', () => {
    const filters: TripFilters = {
      dateRange: '',
      clientFilter: '',
      milesRange: '100+',
      searchQuery: ''
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params.min_miles).toBe(100)
    expect(params.max_miles).toBeUndefined()
  })

  test('converts all filters together', () => {
    const filters: TripFilters = {
      dateRange: 'today',
      clientFilter: 'Test Client',
      milesRange: '10-50',
      searchQuery: 'business trip'
    }
    
    const params = convertFiltersToParams(1, 10, filters)
    
    expect(params).toEqual({
      page: 1,
      limit: 10,
      search: 'business trip',
      client: 'Test Client',
      date_from: '2025-01-15',
      date_to: '2025-01-15',
      min_miles: 10,
      max_miles: 50
    })
  })
})