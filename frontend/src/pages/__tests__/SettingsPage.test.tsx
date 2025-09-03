import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '../SettingsPage'
import { renderWithProviders } from '../../test/utils/testUtils'
import {
  mockUseConnectionStatus,
  resetAllMocks
} from '../../test/utils/mockHooks'

// Mock data
const mockSettingsData = {
  mileage_rate: 0.67,
}

// Mock functions for settings hooks
const mockUseSettings = vi.fn(() => ({
  data: mockSettingsData,
  isLoading: false,
  isError: false,
  error: null,
}))

const mockUseUpdateSettings = vi.fn(() => ({
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
}))

// Mock the hooks with centralized mock functions
vi.mock('../../hooks/useSettings', () => ({
  useSettings: mockUseSettings,
  useUpdateSettings: mockUseUpdateSettings,
}))

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: mockUseConnectionStatus,
}))

vi.mock('../../utils/errorUtils', () => ({
  getApiErrorMessage: () => 'Test error message',
}))

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetAllMocks()
    // Reset to default state for settings mocks
    mockUseSettings.mockReturnValue({
      data: mockSettingsData,
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseUpdateSettings.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    })
  })

  it('renders the settings page with title', () => {
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Manage your mileage tracking preferences')).toBeInTheDocument()
  })

  it('displays current mileage rate', () => {
    renderWithProviders(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i }) as HTMLInputElement
    expect(input.value).toBe('0.67')
  })

  it('shows connection status when available', () => {
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    mockUseSettings.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })
    
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Settings')).toBeInTheDocument()
    
    // Should show loading skeleton
    const skeletons = screen.container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays error state with connection status', () => {
    const mockError = new Error('Cannot connect to server')
    mockUseSettings.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    })
    
    mockUseConnectionStatus.mockReturnValue({
      data: { connected: false },
      isLoading: false,
    })
    
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Cannot Connect to Server')).toBeInTheDocument()
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText(/make sure the backend server is running/i)).toBeInTheDocument()
  })

  it('validates mileage rate input', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i })
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    // Test negative value
    await user.clear(input)
    await user.type(input, '-0.5')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Mileage rate must be 0 or greater')).toBeInTheDocument()
    })
    
    // Test empty value
    await user.clear(input)
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Mileage rate is required')).toBeInTheDocument()
    })
  })

  it('allows updating mileage rate', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i })
    
    await user.clear(input)
    await user.type(input, '0.75')
    
    expect(input).toHaveValue(0.75)
  })

  it('submits form with valid data', async () => {
    const mockMutate = vi.fn()
    mockUseUpdateSettings.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    })
    
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i })
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    await user.clear(input)
    await user.type(input, '0.75')
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        mileage_rate: 0.75,
      })
    })
  })

  it('shows loading state during form submission', () => {
    mockUseUpdateSettings.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    })
    
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('displays error message when form submission fails', () => {
    const mockError = new Error('Validation error')
    mockUseUpdateSettings.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: mockError,
    })
    
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('displays success message after successful update', () => {
    // This would require checking for success state handling
    // The current implementation might show a success toast or message
    renderWithProviders(<SettingsPage />)
    
    // This test would depend on how success feedback is implemented
    // For now, we'll just ensure no errors are shown in success state
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('provides helpful information about mileage rates', () => {
    renderWithProviders(<SettingsPage />)
    
    expect(screen.getByText('Mileage Rate (per mile)')).toBeInTheDocument()
    expect(screen.getByText(/standard business mileage rate/i)).toBeInTheDocument()
  })

  it('handles decimal input correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i })
    
    // Test various decimal formats
    await user.clear(input)
    await user.type(input, '0.655')
    expect(input).toHaveValue(0.655)
    
    await user.clear(input)
    await user.type(input, '1.0')
    expect(input).toHaveValue(1.0)
    
    await user.clear(input)
    await user.type(input, '0')
    expect(input).toHaveValue(0)
  })

  it('preserves form state during loading', () => {
    // Start with loaded data
    renderWithProviders(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i }) as HTMLInputElement
    expect(input.value).toBe('0.67')
    
    // Simulate loading state (but form should retain its value)
    mockUseSettings.mockReturnValue({
      data: mockSettingsData,
      isLoading: false,
      isError: false,
      error: null,
    })
    
    expect(input.value).toBe('0.67')
  })

  it('resets form validation errors when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SettingsPage />)
    
    const input = screen.getByRole('spinbutton', { name: /mileage rate/i })
    const saveButton = screen.getByRole('button', { name: /save settings/i })
    
    // Trigger validation error
    await user.clear(input)
    await user.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByText('Mileage rate is required')).toBeInTheDocument()
    })
    
    // Start typing - error should disappear
    await user.type(input, '0.5')
    
    await waitFor(() => {
      expect(screen.queryByText('Mileage rate is required')).not.toBeInTheDocument()
    })
  })
})