import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import EnhancedTripItem from '../EnhancedTripItem'
import type { Trip } from '../../types'
import { getTodayDateString } from '../../utils/dateUtils'

// Mock the hooks
vi.mock('../../hooks/useTrips', () => ({
  useDeleteTrip: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}))

const mockTrip: Trip = {
  id: 1,
  client_name: 'Test Client',
  trip_date: '2024-01-15',
  miles: 25.5,
  notes: 'Meeting with client at downtown office',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

describe('EnhancedTripItem', () => {
  it('renders trip information correctly', () => {
    render(<EnhancedTripItem trip={mockTrip} />)
    
    expect(screen.getByText('Test Client')).toBeInTheDocument()
    expect(screen.getByText('25.5 miles')).toBeInTheDocument()
    expect(screen.getByText('Meeting with client at downtown office')).toBeInTheDocument()
  })

  it('shows always visible edit and delete buttons when showActions is true', () => {
    render(<EnhancedTripItem trip={mockTrip} showActions={true} />)
    
    const editButton = screen.getByRole('button', { name: 'Edit trip' })
    const deleteButton = screen.getByRole('button', { name: 'Delete trip' })
    
    expect(editButton).toBeInTheDocument()
    expect(deleteButton).toBeInTheDocument()
    expect(editButton).toBeVisible()
    expect(deleteButton).toBeVisible()
  })

  it('hides action buttons when showActions is false', () => {
    render(<EnhancedTripItem trip={mockTrip} showActions={false} />)
    
    expect(screen.queryByRole('button', { name: 'Edit trip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete trip' })).not.toBeInTheDocument()
  })

  it('shows alert when edit button is clicked', () => {
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    
    render(<EnhancedTripItem trip={mockTrip} showActions={true} />)
    
    const editButton = screen.getByRole('button', { name: 'Edit trip' })
    fireEvent.click(editButton)
    
    expect(alertSpy).toHaveBeenCalledWith('Edit functionality will be implemented soon!')
    
    alertSpy.mockRestore()
  })

  it('shows delete confirmation when delete button is clicked', () => {
    render(<EnhancedTripItem trip={mockTrip} showActions={true} />)
    
    const deleteButton = screen.getByRole('button', { name: 'Delete trip' })
    fireEvent.click(deleteButton)
    
    expect(screen.getByText('Delete trip?')).toBeInTheDocument()
    expect(screen.getByText(/This will permanently remove the trip to/)).toBeInTheDocument()
  })

  it('calculates estimated deduction correctly', () => {
    render(<EnhancedTripItem trip={mockTrip} />)
    
    // 25.5 * 0.67 = 17.09
    expect(screen.getByText('17.09')).toBeInTheDocument()
  })

  it('shows proper styling classes for buttons', () => {
    render(<EnhancedTripItem trip={mockTrip} showActions={true} />)
    
    const editButton = screen.getByRole('button', { name: 'Edit trip' })
    const deleteButton = screen.getByRole('button', { name: 'Delete trip' })
    
    // Check for proper styling classes
    expect(editButton).toHaveClass('text-ctp-blue')
    expect(deleteButton).toHaveClass('text-ctp-red')
    expect(editButton).toHaveClass('touch-manipulation')
    expect(deleteButton).toHaveClass('touch-manipulation')
  })

  describe('date display', () => {
    it('displays relative date for past dates correctly', () => {
      const pastTrip = { ...mockTrip, trip_date: '2024-01-15' }
      render(<EnhancedTripItem trip={pastTrip} />)
      
      // Should show formatted date since it's in the past
      expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    })

    it('displays "Today" for today\'s date', () => {
      const todaysTrip = { 
        ...mockTrip, 
        trip_date: getTodayDateString() 
      }
      render(<EnhancedTripItem trip={todaysTrip} />)
      
      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    it('displays "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayTrip = { 
        ...mockTrip, 
        trip_date: yesterday.toISOString().split('T')[0]
      }
      render(<EnhancedTripItem trip={yesterdayTrip} />)
      
      expect(screen.getByText('Yesterday')).toBeInTheDocument()
    })

    it('displays formatted date for dates from earlier this year', () => {
      const earlyThisYear = '2025-01-15'
      const earlyTrip = { ...mockTrip, trip_date: earlyThisYear }
      render(<EnhancedTripItem trip={earlyTrip} />)
      
      // Should show month and day without year for current year dates
      expect(screen.getByText('Jan 15')).toBeInTheDocument()
    })

    it('displays formatted date with year for different year dates', () => {
      const differentYearTrip = { ...mockTrip, trip_date: '2023-06-20' }
      render(<EnhancedTripItem trip={differentYearTrip} />)
      
      // Should show month, day and year for different year dates
      expect(screen.getByText('Jun 20, 2023')).toBeInTheDocument()
    })

    it('handles ISO timestamp format dates correctly', () => {
      const isoDateTrip = { ...mockTrip, trip_date: '2025-01-15T10:00:00Z' }
      render(<EnhancedTripItem trip={isoDateTrip} />)
      
      // Should extract date part and format correctly
      expect(screen.getByText('Jan 15')).toBeInTheDocument()
    })
  })
})