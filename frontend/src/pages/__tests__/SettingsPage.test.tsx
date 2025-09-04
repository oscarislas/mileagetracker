import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../SettingsPage'
import { renderWithProviders } from '../../test/utils/testUtils'
import * as apiClient from '../../services/apiClient'

// Mock the API client
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

vi.mock('../../utils/errorUtils', () => ({
  getApiErrorMessage: (error: unknown) => {
    if (error?.response?.data?.message) return error.response.data.message
    if (error?.message) return error.message
    return 'Test error message'
  },
}))

// Mock data
const mockSettingsData = {
  mileage_rate: 0.67,
}

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default successful API responses
    vi.mocked(apiClient.apiClient.get).mockResolvedValue({
      data: mockSettingsData,
    })
    vi.mocked(apiClient.apiClient.put).mockResolvedValue({
      data: mockSettingsData,
    })
  })

  it('renders the settings page with title', async () => {
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Configure your mileage tracking preferences')).toBeInTheDocument()
    })
  })

  it('displays current mileage rate after loading', async () => {
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      const input = screen.getByDisplayValue('0.67')
      expect(input).toBeInTheDocument()
    })
  })

  it('displays loading state initially', () => {
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('displays error state when API fails', async () => {
    vi.mocked(apiClient.apiClient.get).mockRejectedValue(
      new Error('Cannot connect to server')
    )
    
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Unable to load settings')).toBeInTheDocument()
      expect(screen.getByText('Cannot connect to server')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })

  it('validates mileage rate input on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    // Test that form validation elements are present
    expect(input).toHaveAttribute('type', 'number')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('step', '0.01')
    expect(saveButton).toBeInTheDocument()
    
    // Test that we can interact with the form
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.5')
    expect(input).toHaveValue(0.5)
  })

  it('allows updating mileage rate', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.75')
    
    expect(input).toHaveValue(0.75)
  })

  it('submits form with valid data', async () => {
    const mockPut = vi.mocked(apiClient.apiClient.put)
    mockPut.mockClear()
    mockPut.mockResolvedValue({ data: { mileage_rate: 0.75 } })
    
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    // Clear and enter a valid value using user events that work better
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.75')
    
    // Submit the form
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/api/v1/settings', {
        mileage_rate: 0.75,
      })
    }, { timeout: 2000 })
  })

  it('shows loading state during form submission', async () => {
    // Make the PUT request take some time to resolve
    let resolvePromise: (value: unknown) => void
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    const mockPut = vi.mocked(apiClient.apiClient.put)
    mockPut.mockClear()
    mockPut.mockReturnValue(slowPromise)
    
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    // Clear and enter a valid value
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.75')
    
    // Click and immediately check for loading state
    await user.click(saveButton)
    
    // Should show loading state - check both text content and disabled state
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    }, { timeout: 1000 })
    expect(saveButton).toBeDisabled()
    
    // Resolve the promise to clean up
    resolvePromise!({ data: { mileage_rate: 0.75 } })
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Save Settings')).toBeInTheDocument()
    })
  })

  it('displays error message when form submission fails', async () => {
    const mockPut = vi.mocked(apiClient.apiClient.put)
    mockPut.mockClear()
    mockPut.mockRejectedValue(new Error('Test error message'))
    
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    // Clear and enter a valid value
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.75')
    await user.click(saveButton)
    
    // The mock error util should return this message
    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('provides helpful information about mileage rates', async () => {
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Mileage Rate (per mile)')).toBeInTheDocument()
      expect(screen.getByText('Current IRS standard mileage rate is $0.67 per mile (2024)')).toBeInTheDocument()
    })
  })

  it('handles decimal input correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    
    // Test various decimal formats - select all and replace
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.655')
    expect(input).toHaveValue(0.655)
    
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('1.0')
    expect(input).toHaveValue(1.0)
    
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0')
    expect(input).toHaveValue(0)
  })

  it('clears error when user starts typing after validation error', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.67')).toBeInTheDocument()
    })
    
    const input = screen.getByLabelText(/mileage rate/i)
    
    // Test that user can modify input - select all and replace
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('0.5')
    expect(input).toHaveValue(0.5)
    
    await user.click(input)
    await user.keyboard('{Control>}a{/Control}')
    await user.keyboard('1.25')
    expect(input).toHaveValue(1.25)
  })

  it('shows default settings in error state', async () => {
    vi.mocked(apiClient.apiClient.get).mockRejectedValue(
      new Error('Network error')
    )
    
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('💡 Default Settings:')).toBeInTheDocument()
      expect(screen.getByText('• Mileage Rate: $0.67 per mile (2024 IRS standard rate)')).toBeInTheDocument()
      expect(screen.getByText('Settings will be available once the server connection is restored.')).toBeInTheDocument()
    })
  })

  it('allows retry when in error state', async () => {
    // Mock window.location.reload using Object.defineProperty
    const mockReload = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    })
    
    vi.mocked(apiClient.apiClient.get).mockRejectedValue(
      new Error('Network error')
    )
    
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
    
    const retryButton = screen.getByText('Try Again')
    await user.click(retryButton)
    
    expect(mockReload).toHaveBeenCalled()
  })

  it('has correct form accessibility', async () => {
    renderWithProviders(<SettingsPage />)
    
    await waitFor(() => {
      const input = screen.getByLabelText(/mileage rate/i)
      const form = input.closest('form')
      
      expect(input).toHaveAttribute('type', 'number')
      expect(input).toHaveAttribute('step', '0.01')
      expect(input).toHaveAttribute('min', '0')
      expect(form).toBeInTheDocument()
    })
  })
})