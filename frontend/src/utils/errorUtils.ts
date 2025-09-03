import { AxiosError } from 'axios'

export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Try to get API error message first
    const apiMessage = error.response?.data?.error || error.response?.data?.message
    if (apiMessage && typeof apiMessage === 'string') {
      return apiMessage
    }
    return error.message
  } else if (error instanceof Error) {
    return error.message
  } else if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    // Handle specific API error responses
    if (error.response?.status === 400) {
      return getErrorMessage(error) || 'Invalid request'
    } else if (error.response?.status === 404) {
      return 'Resource not found'
    } else if (error.response?.status === 500) {
      return 'Server error occurred'
    } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      return 'Unable to connect to server'
    }
    return getErrorMessage(error)
  }
  return getErrorMessage(error)
}

export function isConnectionError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR'
  }
  return false
}

export function getHttpStatus(error: unknown): number | undefined {
  if (isAxiosError(error)) {
    return error.response?.status
  }
  return undefined
}