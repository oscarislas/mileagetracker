import { describe, it, expect } from 'vitest'
import { isAxiosError, getErrorMessage, getApiErrorMessage } from '../errorUtils'
import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios'

describe('errorUtils', () => {
  describe('isAxiosError', () => {
    it('returns true for AxiosError instances', () => {
      const axiosError = new AxiosError('Test error')
      expect(isAxiosError(axiosError)).toBe(true)
    })

    it('returns false for regular Error instances', () => {
      const regularError = new Error('Regular error')
      expect(isAxiosError(regularError)).toBe(false)
    })

    it('returns false for non-error objects', () => {
      expect(isAxiosError('string')).toBe(false)
      expect(isAxiosError(null)).toBe(false)
      expect(isAxiosError(undefined)).toBe(false)
      expect(isAxiosError({})).toBe(false)
      expect(isAxiosError(123)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('returns message from Error instance', () => {
      const error = new Error('Test error message')
      expect(getErrorMessage(error)).toBe('Test error message')
    })

    it('returns string value directly', () => {
      expect(getErrorMessage('Direct error string')).toBe('Direct error string')
    })

    it('returns stringified object', () => {
      const errorObj = { message: 'Object error' }
      expect(getErrorMessage(errorObj)).toBe(JSON.stringify(errorObj))
    })

    it('handles null and undefined', () => {
      expect(getErrorMessage(null)).toBe('null')
      expect(getErrorMessage(undefined)).toBe('undefined')
    })

    it('handles numbers and booleans', () => {
      expect(getErrorMessage(404)).toBe('404')
      expect(getErrorMessage(true)).toBe('true')
      expect(getErrorMessage(false)).toBe('false')
    })
  })

  describe('getApiErrorMessage', () => {
    it('returns specific message for 400 Bad Request', () => {
      const axiosError = new AxiosError('Bad request', 'BAD_REQUEST', undefined, undefined, {
        status: 400,
        data: { error: 'Invalid data' },
        statusText: 'Bad Request',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toContain('Invalid request')
    })

    it('returns specific message for 401 Unauthorized', () => {
      const axiosError = new AxiosError('Unauthorized', 'UNAUTHORIZED', undefined, undefined, {
        status: 401,
        data: {},
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Authentication required')
    })

    it('returns specific message for 403 Forbidden', () => {
      const axiosError = new AxiosError('Forbidden', 'FORBIDDEN', undefined, undefined, {
        status: 403,
        data: {},
        statusText: 'Forbidden',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Access denied')
    })

    it('returns specific message for 404 Not Found', () => {
      const axiosError = new AxiosError('Not found', 'NOT_FOUND', undefined, undefined, {
        status: 404,
        data: {},
        statusText: 'Not Found',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Resource not found')
    })

    it('returns specific message for 500 Internal Server Error', () => {
      const axiosError = new AxiosError('Server error', 'INTERNAL_ERROR', undefined, undefined, {
        status: 500,
        data: {},
        statusText: 'Internal Server Error',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Server error occurred')
    })

    it('returns network error message for no response', () => {
      const axiosError = new AxiosError('Network Error', 'NETWORK_ERROR')
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Cannot connect to server')
    })

    it('returns error message from response data when available', () => {
      const axiosError = new AxiosError('Bad request', 'BAD_REQUEST', undefined, undefined, {
        status: 400,
        data: { error: 'Custom error message' },
        statusText: 'Bad Request',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Custom error message')
    })

    it('returns validation errors when present', () => {
      const axiosError = new AxiosError('Validation failed', 'BAD_REQUEST', undefined, undefined, {
        status: 400,
        data: { 
          error: 'Validation failed',
          details: {
            validation_errors: [
              { field: 'miles', message: 'Miles must be positive' },
              { field: 'client_name', message: 'Client name is required' }
            ]
          }
        },
        statusText: 'Bad Request',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toContain('Miles must be positive')
      expect(result).toContain('Client name is required')
    })

    it('falls back to generic error message for unknown status codes', () => {
      const axiosError = new AxiosError('Weird error', 'UNKNOWN', undefined, undefined, {
        status: 418, // I'm a teapot
        data: {},
        statusText: "I'm a teapot",
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Weird error')
    })

    it('handles non-Axios errors by falling back to getErrorMessage', () => {
      const regularError = new Error('Regular error message')
      
      const result = getApiErrorMessage(regularError)
      expect(result).toBe('Regular error message')
    })

    it('handles timeout errors', () => {
      const axiosError = new AxiosError('timeout of 5000ms exceeded', 'ECONNABORTED')
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Request timeout - please try again')
    })

    it('extracts nested error messages from response', () => {
      const axiosError = new AxiosError('Server error', 'INTERNAL_ERROR', undefined, undefined, {
        status: 500,
        data: { 
          message: 'Database connection failed',
          error: 'Internal server error' 
        },
        statusText: 'Internal Server Error',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Database connection failed')
    })

    it('handles malformed response data gracefully', () => {
      const axiosError = new AxiosError('Bad response', 'BAD_RESPONSE', undefined, undefined, {
        status: 200,
        data: 'This is not JSON',
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config: {} as InternalAxiosRequestConfig
      })
      
      const result = getApiErrorMessage(axiosError)
      expect(result).toBe('Bad response')
    })
  })
})