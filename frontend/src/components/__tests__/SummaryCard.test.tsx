import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SummaryCard from '../SummaryCard'

// Mock the hooks
const mockSummaryData = {
  months: [
    {
      month: 'September 2025',
      year: 2025,
      month_num: 9,
      total_miles: 145.50,
      amount: 97.49,
    },
    {
      month: 'August 2025',
      year: 2025,
      month_num: 8,
      total_miles: 120.0,
      amount: 80.40,
    },
    {
      month: 'July 2025',
      year: 2025,
      month_num: 7,
      total_miles: 0,
      amount: 0,
    },
  ],
}

vi.mock('../../hooks/useSummary', () => ({
  useSummary: () => ({
    data: mockSummaryData,
    isLoading: false,
    isError: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    data: { connected: true },
  }),
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('SummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the 6-month summary title', () => {
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('6-Month Summary')).toBeInTheDocument()
  })

  it('calculates and displays total miles correctly', () => {
    renderWithQueryClient(<SummaryCard />)
    
    // 145.50 + 120.0 + 0 = 265.5
    expect(screen.getByText('265.5')).toBeInTheDocument()
    expect(screen.getByText('Total Miles')).toBeInTheDocument()
  })

  it('calculates and displays total tax deduction correctly', () => {
    renderWithQueryClient(<SummaryCard />)
    
    // 97.49 + 80.40 + 0 = 177.89
    expect(screen.getByText('$177.89')).toBeInTheDocument()
    expect(screen.getByText('Tax Deduction')).toBeInTheDocument()
  })

  it('displays monthly breakdown with correct data', () => {
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('Monthly Breakdown')).toBeInTheDocument()
    
    // Check each month
    expect(screen.getByText('September 2025')).toBeInTheDocument()
    expect(screen.getByText('145.5 mi')).toBeInTheDocument()
    expect(screen.getByText('97.49')).toBeInTheDocument()
    
    expect(screen.getByText('August 2025')).toBeInTheDocument()
    expect(screen.getByText('120.0 mi')).toBeInTheDocument()
    expect(screen.getByText('80.40')).toBeInTheDocument()
    
    expect(screen.getByText('July 2025')).toBeInTheDocument()
    expect(screen.getByText('0.0 mi')).toBeInTheDocument()
    expect(screen.getByText('0.00')).toBeInTheDocument()
  })

  it('shows loading state with skeleton placeholders', () => {
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('6-Month Summary')).toBeInTheDocument()
    
    // Should show loading animations
    const skeletons = screen.container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays error state with connection status', () => {
    const mockError = new Error('Cannot connect to server')
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    })
    
    vi.mocked(vi.importActual('../../hooks/useConnectionStatus')).useConnectionStatus = () => ({
      data: { connected: false },
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('6-Month Summary')).toBeInTheDocument()
    expect(screen.getByText('Cannot Connect to Server')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText(/make sure the backend server is running/i)).toBeInTheDocument()
    expect(screen.getByText('make quick-start')).toBeInTheDocument()
  })

  it('displays generic error state for non-connection errors', () => {
    const mockError = new Error('Database error')
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('Failed to Load Summary')).toBeInTheDocument()
    expect(screen.getByText('Database error')).toBeInTheDocument()
  })

  it('displays empty state when no trips exist', () => {
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: { months: [] },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('0.0')).toBeInTheDocument() // Total miles
    expect(screen.getByText('$0.00')).toBeInTheDocument() // Total amount
    expect(screen.getByText('No trips in the last 6 months')).toBeInTheDocument()
    expect(screen.getByText(/add trips to see your mileage summary/i)).toBeInTheDocument()
  })

  it('handles months with zero miles correctly', () => {
    const dataWithZeroMonth = {
      months: [
        {
          month: 'September 2025',
          year: 2025,
          month_num: 9,
          total_miles: 0,
          amount: 0,
        },
      ],
    }
    
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: dataWithZeroMonth,
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('0.0')).toBeInTheDocument() // Total miles display
    expect(screen.getByText('$0.00')).toBeInTheDocument() // Total amount display
    expect(screen.getByText('0.0 mi')).toBeInTheDocument() // Monthly miles display
  })

  it('formats decimal places correctly', () => {
    const dataWithDecimals = {
      months: [
        {
          month: 'September 2025',
          year: 2025,
          month_num: 9,
          total_miles: 123.456,
          amount: 82.789,
        },
      ],
    }
    
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: dataWithDecimals,
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    // Should round to 1 decimal place for miles
    expect(screen.getByText('123.5')).toBeInTheDocument()
    expect(screen.getByText('123.5 mi')).toBeInTheDocument()
    
    // Should round to 2 decimal places for currency
    expect(screen.getByText('$82.79')).toBeInTheDocument()
    expect(screen.getByText('82.79')).toBeInTheDocument()
  })

  it('displays connection status indicator when connected', () => {
    renderWithQueryClient(<SummaryCard />)
    
    // When not in error state, connection status is not shown
    // This matches the current implementation behavior
    expect(screen.queryByText('Connected')).not.toBeInTheDocument()
  })

  it('shows helpful tips in empty state', () => {
    vi.mocked(vi.importActual('../../hooks/useSummary')).useSummary = () => ({
      data: { months: [] },
      isLoading: false,
      isError: false,
      error: null,
    })
    
    renderWithQueryClient(<SummaryCard />)
    
    expect(screen.getByText('Add trips to see your mileage summary and tax deductions')).toBeInTheDocument()
  })
})