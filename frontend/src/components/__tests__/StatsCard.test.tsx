import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import StatsCard from '../StatsCard'
import { renderWithProviders } from '../../test/utils/testUtils'
import { mockUseSummary, resetAllMocks } from '../../test/utils/mockHooks'

// Mock the hooks
vi.mock('../../hooks/useSummary', () => ({
  useSummary: mockUseSummary,
}))

// Mock LoadingSkeletons
vi.mock('../LoadingSkeletons', () => ({
  StatsCardSkeleton: () => <div data-testid="stats-card-skeleton">Loading stats...</div>,
}))

describe('StatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllMocks()
  })

  it('renders stats data when available', () => {
    renderWithProviders(<StatsCard />)
    
    expect(screen.getByText('Total Trips')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    
    expect(screen.getByText('Total Miles')).toBeInTheDocument()
    expect(screen.getByText('200.5')).toBeInTheDocument()
    
    expect(screen.getByText('Total Clients')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    mockUseSummary.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    
    renderWithProviders(<StatsCard />)
    
    expect(screen.getByTestId('stats-card-skeleton')).toBeInTheDocument()
    expect(screen.getByText('Loading stats...')).toBeInTheDocument()
  })

  it('displays error state gracefully', () => {
    mockUseSummary.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    
    renderWithProviders(<StatsCard />)
    
    // Should show empty state or error message
    expect(screen.getByText(/unable to load stats/i)).toBeInTheDocument()
  })

  it('displays zero values correctly', () => {
    mockUseSummary.mockReturnValue({
      data: {
        total_trips: 0,
        total_miles: 0,
        total_clients: 0,
        this_month: { trips: 0, miles: 0 },
        this_year: { trips: 0, miles: 0 },
      },
      isLoading: false,
      isError: false,
    })
    
    renderWithProviders(<StatsCard />)
    
    const zeroValues = screen.getAllByText('0')
    expect(zeroValues.length).toBeGreaterThan(0)
  })

  it('formats large numbers correctly', () => {
    mockUseSummary.mockReturnValue({
      data: {
        total_trips: 1234,
        total_miles: 12345.67,
        total_clients: 89,
        this_month: { trips: 123, miles: 1234.5 },
        this_year: { trips: 1000, miles: 10000.25 },
      },
      isLoading: false,
      isError: false,
    })
    
    renderWithProviders(<StatsCard />)
    
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('12,345.67')).toBeInTheDocument()
  })

  it('shows monthly stats when available', () => {
    renderWithProviders(<StatsCard />)
    
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(screen.getByText(/2.*trips/i)).toBeInTheDocument()
    expect(screen.getByText(/200\.5.*miles/i)).toBeInTheDocument()
  })

  it('shows yearly stats when available', () => {
    renderWithProviders(<StatsCard />)
    
    expect(screen.getByText('This Year')).toBeInTheDocument()
    expect(screen.getByText(/2.*trips/i)).toBeInTheDocument()
    expect(screen.getByText(/200\.5.*miles/i)).toBeInTheDocument()
  })

  it('handles missing monthly/yearly data gracefully', () => {
    mockUseSummary.mockReturnValue({
      data: {
        total_trips: 10,
        total_miles: 100,
        total_clients: 5,
        // Missing this_month and this_year
      },
      isLoading: false,
      isError: false,
    })
    
    renderWithProviders(<StatsCard />)
    
    // Should still show total stats
    expect(screen.getByText('Total Trips')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    
    // Monthly/yearly sections should handle missing data
    expect(screen.queryByText('This Month')).toBeInTheDocument()
  })

  it('has proper accessibility structure', () => {
    renderWithProviders(<StatsCard />)
    
    // Should have proper headings
    expect(screen.getByRole('heading', { name: /statistics/i })).toBeInTheDocument()
    
    // Stats should be in a structured format
    const statsRegion = screen.getByRole('region', { name: /statistics/i })
    expect(statsRegion).toBeInTheDocument()
  })

  it('uses semantic HTML for stats presentation', () => {
    renderWithProviders(<StatsCard />)
    
    // Stats should be presented as definition lists or similar semantic structure
    const container = screen.getByRole('region', { name: /statistics/i })
    expect(container).toBeInTheDocument()
    
    // Each stat should be clearly labeled
    expect(screen.getByText('Total Trips')).toBeInTheDocument()
    expect(screen.getByText('Total Miles')).toBeInTheDocument()
    expect(screen.getByText('Total Clients')).toBeInTheDocument()
  })

  it('provides helpful context for empty stats', () => {
    mockUseSummary.mockReturnValue({
      data: {
        total_trips: 0,
        total_miles: 0,
        total_clients: 0,
        this_month: { trips: 0, miles: 0 },
        this_year: { trips: 0, miles: 0 },
      },
      isLoading: false,
      isError: false,
    })
    
    renderWithProviders(<StatsCard />)
    
    // Should provide encouraging message or tips for new users
    expect(screen.getByText(/start tracking/i)).toBeInTheDocument()
  })

  it('refreshes data appropriately', () => {
    const { rerender } = renderWithProviders(<StatsCard />)
    
    // Initial render
    expect(screen.getByText('2')).toBeInTheDocument()
    
    // Update mock data
    mockUseSummary.mockReturnValue({
      data: {
        total_trips: 5,
        total_miles: 500,
        total_clients: 3,
        this_month: { trips: 3, miles: 300 },
        this_year: { trips: 5, miles: 500 },
      },
      isLoading: false,
      isError: false,
    })
    
    rerender(<StatsCard />)
    
    // Should show updated data
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
  })
})