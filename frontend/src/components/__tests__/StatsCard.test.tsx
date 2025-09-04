import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { TruckIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import StatsCard from '../StatsCard'
import { renderWithProviders } from '../../test/utils/testUtils'

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Total Miles',
    value: '1,245.3',
    subtitle: 'This month',
    icon: TruckIcon,
    color: 'blue' as const,
  }

  it('renders basic card information', () => {
    renderWithProviders(<StatsCard {...defaultProps} />)
    
    expect(screen.getByText('Total Miles')).toBeInTheDocument()
    expect(screen.getByText('1,245.3')).toBeInTheDocument()
    expect(screen.getByText('This month')).toBeInTheDocument()
  })

  it('renders without subtitle', () => {
    const { subtitle, ...propsWithoutSubtitle } = defaultProps
    void subtitle // Suppress unused variable warning
    renderWithProviders(<StatsCard {...propsWithoutSubtitle} />)
    
    expect(screen.getByText('Total Miles')).toBeInTheDocument()
    expect(screen.getByText('1,245.3')).toBeInTheDocument()
    expect(screen.queryByText('This month')).not.toBeInTheDocument()
  })

  it('renders with trend information', () => {
    const propsWithTrend = {
      ...defaultProps,
      trend: { value: 12.5, label: 'vs last month' },
    }
    
    renderWithProviders(<StatsCard {...propsWithTrend} />)
    
    expect(screen.getByText('12.5% vs last month')).toBeInTheDocument()
    expect(screen.getByText('↗')).toBeInTheDocument() // Up arrow for positive trend
  })

  it('renders negative trend correctly', () => {
    const propsWithNegativeTrend = {
      ...defaultProps,
      trend: { value: -8.2, label: 'vs last month' },
    }
    
    renderWithProviders(<StatsCard {...propsWithNegativeTrend} />)
    
    expect(screen.getByText('8.2% vs last month')).toBeInTheDocument() // Absolute value
    expect(screen.getByText('↘')).toBeInTheDocument() // Down arrow for negative trend
  })

  it('applies correct color classes for blue theme', () => {
    const { container } = renderWithProviders(<StatsCard {...defaultProps} color="blue" />)
    
    // Check that the icon container has blue styling - look for the div with blue background
    const iconContainer = container.querySelector('.bg-ctp-blue\\/10')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('text-ctp-blue', 'border-ctp-blue/20')
  })

  it('applies correct color classes for green theme', () => {
    const greenProps = { ...defaultProps, color: 'green' as const }
    const { container } = renderWithProviders(<StatsCard {...greenProps} />)
    
    const iconContainer = container.querySelector('.bg-ctp-green\\/10')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('text-ctp-green', 'border-ctp-green/20')
  })

  it('applies correct color classes for purple theme', () => {
    const purpleProps = { ...defaultProps, color: 'purple' as const }
    const { container } = renderWithProviders(<StatsCard {...purpleProps} />)
    
    const iconContainer = container.querySelector('.bg-ctp-mauve\\/10')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('text-ctp-mauve', 'border-ctp-mauve/20')
  })

  it('applies correct color classes for yellow theme', () => {
    const yellowProps = { ...defaultProps, color: 'yellow' as const }
    const { container } = renderWithProviders(<StatsCard {...yellowProps} />)
    
    const iconContainer = container.querySelector('.bg-ctp-yellow\\/10')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('text-ctp-yellow', 'border-ctp-yellow/20')
  })

  it('renders with different icons', () => {
    const dollarProps = {
      ...defaultProps,
      title: 'Revenue',
      icon: CurrencyDollarIcon,
    }
    
    const { container } = renderWithProviders(<StatsCard {...dollarProps} />)
    
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    // Icon should be rendered - check for the icon container div with blue background (default)
    const iconContainer = container.querySelector('.bg-ctp-blue\\/10')
    expect(iconContainer).toBeInTheDocument()
  })

  it('handles numeric values', () => {
    const numericProps = { ...defaultProps, value: 42 }
    renderWithProviders(<StatsCard {...numericProps} />)
    
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('handles zero values', () => {
    const zeroProps = { ...defaultProps, value: 0 }
    renderWithProviders(<StatsCard {...zeroProps} />)
    
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('has proper accessibility structure', () => {
    const { container } = renderWithProviders(<StatsCard {...defaultProps} />)
    
    // The card should be a focusable container with hover effects
    const card = container.querySelector('.bg-ctp-surface0')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('hover:border-ctp-surface2', 'transition-all')
  })

  it('displays trend with green color for positive values', () => {
    const positiveTrendProps = {
      ...defaultProps,
      trend: { value: 15.5, label: 'improvement' },
    }
    
    const { container } = renderWithProviders(<StatsCard {...positiveTrendProps} />)
    
    expect(screen.getByText('15.5% improvement')).toBeInTheDocument()
    // Look for the trend container with green color
    const trendContainer = container.querySelector('.text-ctp-green')
    expect(trendContainer).toBeInTheDocument()
  })

  it('displays trend with red color for negative values', () => {
    const negativeTrendProps = {
      ...defaultProps,
      trend: { value: -10.3, label: 'decrease' },
    }
    
    const { container } = renderWithProviders(<StatsCard {...negativeTrendProps} />)
    
    expect(screen.getByText('10.3% decrease')).toBeInTheDocument()
    // Look for the trend container with red color
    const trendContainer = container.querySelector('.text-ctp-red')
    expect(trendContainer).toBeInTheDocument()
  })

  it('renders long titles and values without breaking layout', () => {
    const longTextProps = {
      ...defaultProps,
      title: 'Very Long Statistics Title That Should Not Break Layout',
      value: '99,999,999.99',
      subtitle: 'This is a very long subtitle that describes the statistic in detail',
    }
    
    renderWithProviders(<StatsCard {...longTextProps} />)
    
    expect(screen.getByText('Very Long Statistics Title That Should Not Break Layout')).toBeInTheDocument()
    expect(screen.getByText('99,999,999.99')).toBeInTheDocument()
    expect(screen.getByText('This is a very long subtitle that describes the statistic in detail')).toBeInTheDocument()
  })

  it('renders currency values correctly', () => {
    const currencyProps = {
      ...defaultProps,
      title: 'Tax Deduction',
      value: '$1,234.56',
      icon: CurrencyDollarIcon,
      color: 'green' as const,
    }
    
    renderWithProviders(<StatsCard {...currencyProps} />)
    
    expect(screen.getByText('Tax Deduction')).toBeInTheDocument()
    expect(screen.getByText('$1,234.56')).toBeInTheDocument()
  })
})