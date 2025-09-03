import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  TripItemSkeleton, 
  SummaryCardSkeleton, 
  StatsOverviewSkeleton,
  TripsEmptyState,
  ConnectionErrorState
} from '../LoadingSkeletons'

describe('LoadingSkeletons', () => {
  describe('TripItemSkeleton', () => {
    it('renders skeleton for trip item', () => {
      const { container } = render(<TripItemSkeleton />)
      
      // Should contain skeleton elements with proper structure
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(container.querySelector('.bg-ctp-surface0')).toBeInTheDocument()
      expect(container.querySelectorAll('.bg-ctp-surface2').length).toBeGreaterThan(0)
    })

    it('has proper card structure', () => {
      const { container } = render(<TripItemSkeleton />)
      
      // Should have rounded corners and proper spacing
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
      expect(container.querySelector('.border-ctp-surface1')).toBeInTheDocument()
    })
  })

  describe('SummaryCardSkeleton', () => {
    it('renders skeleton for summary card', () => {
      const { container } = render(<SummaryCardSkeleton />)
      
      // Should have loading animation
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(container.querySelector('.bg-ctp-surface0')).toBeInTheDocument()
    })

    it('maintains proper card structure with grid layout', () => {
      const { container } = render(<SummaryCardSkeleton />)
      
      // Should have grid layout for stats
      expect(container.querySelector('.grid')).toBeInTheDocument()
      expect(container.querySelectorAll('.bg-ctp-surface2').length).toBeGreaterThan(0)
    })
  })

  describe('StatsOverviewSkeleton', () => {
    it('renders skeleton for stats overview', () => {
      const { container } = render(<StatsOverviewSkeleton />)
      
      // Should have loading animation
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument()
    })

    it('has proper grid layout for stats', () => {
      const { container } = render(<StatsOverviewSkeleton />)
      
      // Should have 3-column grid
      expect(container.querySelector('.grid-cols-3')).toBeInTheDocument()
      expect(container.querySelectorAll('.bg-ctp-surface2').length).toBeGreaterThan(0)
    })
  })

  describe('TripsEmptyState', () => {
    it('renders empty state message', () => {
      render(<TripsEmptyState />)
      
      expect(screen.getByText('No trips recorded yet')).toBeInTheDocument()
      expect(screen.getByText('Start tracking your business mileage')).toBeInTheDocument()
    })

    it('provides helpful getting started tips', () => {
      render(<TripsEmptyState />)
      
      expect(screen.getByText('💡 Getting Started')).toBeInTheDocument()
      expect(screen.getByText(/Enter your client name/)).toBeInTheDocument()
      expect(screen.getByText(/Add trip date and miles driven/)).toBeInTheDocument()
    })

    it('has proper accessibility structure', () => {
      render(<TripsEmptyState />)
      
      const heading = screen.getByRole('heading', { name: /no trips recorded/i })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('ConnectionErrorState', () => {
    it('renders error message', () => {
      render(<ConnectionErrorState />)
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument()
      expect(screen.getByText('Cannot connect to the server')).toBeInTheDocument()
    })

    it('shows retry button when onRetry is provided', () => {
      const onRetry = vi.fn()
      render(<ConnectionErrorState onRetry={onRetry} />)
      
      const retryButton = screen.getByRole('button', { name: /try again/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('does not show retry button when onRetry is not provided', () => {
      render(<ConnectionErrorState />)
      
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn()
      render(<ConnectionErrorState onRetry={onRetry} />)
      
      const user = userEvent.setup()
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)
      
      expect(onRetry).toHaveBeenCalledOnce()
    })
  })

  describe('Visual consistency', () => {
    it('all skeletons use consistent theme colors', () => {
      const { container: tripContainer } = render(<TripItemSkeleton />)
      const { container: summaryContainer } = render(<SummaryCardSkeleton />)
      const { container: statsContainer } = render(<StatsOverviewSkeleton />)
      
      // All should use Catppuccin theme colors
      expect(tripContainer.querySelector('[class*="ctp-surface"]')).toBeInTheDocument()
      expect(summaryContainer.querySelector('[class*="ctp-surface"]')).toBeInTheDocument()
      expect(statsContainer.querySelector('[class*="ctp-"]')).toBeInTheDocument()
    })

    it('skeletons have proper loading animation', () => {
      const { container: tripContainer } = render(<TripItemSkeleton />)
      const { container: summaryContainer } = render(<SummaryCardSkeleton />)
      const { container: statsContainer } = render(<StatsOverviewSkeleton />)
      
      expect(tripContainer.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(summaryContainer.querySelector('.animate-pulse')).toBeInTheDocument()
      expect(statsContainer.querySelector('.animate-pulse')).toBeInTheDocument()
    })
  })
})