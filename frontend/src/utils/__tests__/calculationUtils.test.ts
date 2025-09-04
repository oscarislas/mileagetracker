import {
  calculateMileageDeduction,
  formatCurrency,
  formatMiles,
  calculatePercentageChange,
  calculateAverage,
  calculateSummaryTotals,
  calculateTrend,
  MILEAGE_RATE
} from '../calculationUtils'

describe('calculationUtils', () => {
  describe('calculateMileageDeduction', () => {
    it('should calculate deduction with default rate', () => {
      expect(calculateMileageDeduction(100)).toBe(100 * MILEAGE_RATE)
    })

    it('should calculate deduction with custom rate', () => {
      expect(calculateMileageDeduction(100, 0.5)).toBe(50)
    })

    it('should handle decimal miles', () => {
      expect(calculateMileageDeduction(25.5)).toBe(25.5 * MILEAGE_RATE)
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with default options', () => {
      expect(formatCurrency(123.45)).toBe('$123.45')
    })

    it('should format currency with custom options', () => {
      expect(formatCurrency(123.456, { maximumFractionDigits: 3 })).toBe('$123.456')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })
  })

  describe('formatMiles', () => {
    it('should format singular mile', () => {
      expect(formatMiles(1)).toBe('1.0 mile')
    })

    it('should format plural miles', () => {
      expect(formatMiles(2)).toBe('2.0 miles')
      expect(formatMiles(0)).toBe('0.0 miles')
    })

    it('should respect precision parameter', () => {
      expect(formatMiles(25.567, 2)).toBe('25.57 miles')
    })
  })

  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change', () => {
      expect(calculatePercentageChange(120, 100)).toBe(20)
    })

    it('should calculate negative percentage change', () => {
      expect(calculatePercentageChange(80, 100)).toBe(-20)
    })

    it('should handle zero previous value', () => {
      expect(calculatePercentageChange(50, 0)).toBe(100)
      expect(calculatePercentageChange(0, 0)).toBe(0)
    })
  })

  describe('calculateAverage', () => {
    it('should calculate average of numbers', () => {
      expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
    })

    it('should handle empty array', () => {
      expect(calculateAverage([])).toBe(0)
    })

    it('should handle single value', () => {
      expect(calculateAverage([42])).toBe(42)
    })
  })

  describe('calculateSummaryTotals', () => {
    it('should calculate totals from monthly data', () => {
      const monthlyData = [
        { total_miles: 100, amount: 67 },
        { total_miles: 200, amount: 134 },
        { total_miles: 150, amount: 100.5 }
      ]

      const result = calculateSummaryTotals(monthlyData)
      expect(result).toEqual({
        totalMiles: 450,
        totalAmount: 301.5,
        totalMonths: 3
      })
    })

    it('should handle empty data', () => {
      const result = calculateSummaryTotals([])
      expect(result).toEqual({
        totalMiles: 0,
        totalAmount: 0,
        totalMonths: 0
      })
    })
  })

  describe('calculateTrend', () => {
    it('should calculate positive trend', () => {
      const recentValues = [120, 130, 140]
      const olderValues = [100, 110, 120]
      
      const trend = calculateTrend(recentValues, olderValues)
      expect(trend).toBeCloseTo(18.18, 2)
    })

    it('should calculate negative trend', () => {
      const recentValues = [80, 90, 100]
      const olderValues = [100, 110, 120]
      
      const trend = calculateTrend(recentValues, olderValues)
      expect(trend).toBeCloseTo(-18.18, 2)
    })

    it('should handle empty arrays', () => {
      expect(calculateTrend([], [])).toBe(0)
    })
  })
})