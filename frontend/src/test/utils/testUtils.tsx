import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { AllTheProviders } from './TestProviders'

// Custom render function with React Query provider
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options })
}

// Also export as default for backwards compatibility
export default renderWithProviders

// Re-export everything from React Testing Library for convenience
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'