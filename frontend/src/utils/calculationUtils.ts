/**
 * Business calculation utilities
 */

/** Standard IRS mileage rate for business deductions (2024) */
export const MILEAGE_RATE = 0.67

/**
 * Calculate estimated tax deduction for miles driven
 */
export function calculateMileageDeduction(miles: number, rate: number = MILEAGE_RATE): number {
  return miles * rate
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  }).format(amount)
}

/**
 * Format miles for display
 */
export function formatMiles(miles: number, precision: number = 1): string {
  return `${miles.toFixed(precision)} ${miles === 1 ? 'mile' : 'miles'}`
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/**
 * Calculate totals from monthly summary data
 */
export function calculateSummaryTotals(monthlyData: Array<{ total_miles: number; amount: number }>) {
  return monthlyData.reduce(
    (totals, month) => ({
      totalMiles: totals.totalMiles + month.total_miles,
      totalAmount: totals.totalAmount + month.amount,
      totalMonths: totals.totalMonths + 1
    }),
    { totalMiles: 0, totalAmount: 0, totalMonths: 0 }
  )
}

/**
 * Calculate trend from recent vs older data
 */
export function calculateTrend(recentValues: number[], olderValues: number[]): number {
  const recentAvg = calculateAverage(recentValues)
  const olderAvg = calculateAverage(olderValues)
  
  return calculatePercentageChange(recentAvg, olderAvg)
}