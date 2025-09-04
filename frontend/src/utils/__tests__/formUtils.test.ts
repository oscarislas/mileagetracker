import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  validateClientName,
  validateMiles,
  validateDate,
  validateTripForm,
  debounce,
  clearFieldError,
  setFieldError
} from '../formUtils'

describe('formUtils', () => {
  describe('validateClientName', () => {
    it('should return error for empty client name', () => {
      expect(validateClientName({ clientName: '' })).toBe('Client name is required')
      expect(validateClientName({ clientName: '   ' })).toBe('Client name is required')
    })

    it('should return error for client name exceeding max length', () => {
      const longName = 'a'.repeat(31)
      expect(validateClientName({ clientName: longName })).toBe('Client name must be 30 characters or less')
    })

    it('should return undefined for valid client name', () => {
      expect(validateClientName({ clientName: 'Valid Client' })).toBeUndefined()
    })

    it('should respect custom max length', () => {
      expect(validateClientName({ clientName: 'Long Name', maxLength: 5 })).toBe('Client name must be 5 characters or less')
    })
  })

  describe('validateMiles', () => {
    it('should return error for zero or negative miles', () => {
      expect(validateMiles({ miles: 0 })).toBe('Miles must be greater than 0')
      expect(validateMiles({ miles: -5 })).toBe('Miles must be greater than 0')
    })

    it('should return undefined for positive miles', () => {
      expect(validateMiles({ miles: 10.5 })).toBeUndefined()
    })

    it('should respect custom minimum value', () => {
      expect(validateMiles({ miles: 5, minValue: 10 })).toBe('Miles must be greater than 0')
    })
  })

  describe('validateDate', () => {
    it('should return error for empty date', () => {
      expect(validateDate({ date: '' })).toBe('Trip date is required')
    })

    it('should return undefined for valid date', () => {
      expect(validateDate({ date: '2024-01-01' })).toBeUndefined()
    })
  })

  describe('validateTripForm', () => {
    it('should validate complete trip form', () => {
      const validForm = {
        client_name: 'Test Client',
        trip_date: '2024-01-01',
        miles: 25.5
      }

      const result = validateTripForm(validForm)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should return errors for invalid form', () => {
      const invalidForm = {
        client_name: '',
        trip_date: '',
        miles: 0
      }

      const result = validateTripForm(invalidForm)
      expect(result.isValid).toBe(false)
      expect(result.errors).toEqual({
        client_name: 'Client name is required',
        trip_date: 'Trip date is required',
        miles: 'Miles must be greater than 0'
      })
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.clearAllTimers()
      vi.useRealTimers()
    })

    it('should delay function execution', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('test')
      expect(mockFn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should cancel previous calls', () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('first')
      debouncedFn('second')
      
      vi.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('second')
    })
  })

  describe('clearFieldError', () => {
    it('should remove specific field error', () => {
      const errors = { field1: 'Error 1', field2: 'Error 2' }
      const result = clearFieldError(errors, 'field1')
      
      expect(result).toEqual({ field2: 'Error 2' })
      expect(result).not.toBe(errors) // Should return new object
    })
  })

  describe('setFieldError', () => {
    it('should set field error', () => {
      const errors = { field1: 'Error 1' }
      const result = setFieldError(errors, 'field2', 'Error 2')
      
      expect(result).toEqual({ field1: 'Error 1', field2: 'Error 2' })
      expect(result).not.toBe(errors) // Should return new object
    })
  })
})