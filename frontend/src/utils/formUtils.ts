import type { FormErrors } from "../types";

/**
 * Common form validation utilities
 */

export interface ClientNameValidation {
  clientName: string;
  maxLength?: number;
}

export interface MilesValidation {
  miles: number;
  minValue?: number;
}

export interface DateValidation {
  date: string;
}

/**
 * Validates client name field
 */
export function validateClientName({
  clientName,
  maxLength = 30,
}: ClientNameValidation): string | undefined {
  if (!clientName.trim()) {
    return "Client name is required";
  }
  if (clientName.length > maxLength) {
    return `Client name must be ${maxLength} characters or less`;
  }
  return undefined;
}

/**
 * Validates miles field
 */
export function validateMiles({
  miles,
  minValue = 0,
}: MilesValidation): string | undefined {
  if (miles <= minValue) {
    return "Miles must be greater than 0";
  }
  return undefined;
}

/**
 * Validates date field
 */
export function validateDate({ date }: DateValidation): string | undefined {
  if (!date) {
    return "Trip date is required";
  }
  return undefined;
}

/**
 * Generic form validator that runs multiple validation functions
 */
export function validateForm<T extends Record<string, unknown>>(
  data: T,
  validators: Record<keyof T, (value: T[keyof T]) => string | undefined>,
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const [field, validator] of Object.entries(validators) as Array<
    [keyof T, (value: T[keyof T]) => string | undefined]
  >) {
    const error = validator(data[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Trip form validation helper
 */
export function validateTripForm(formData: {
  client_name: string;
  trip_date: string;
  miles: number;
}): { isValid: boolean; errors: FormErrors } {
  const { isValid, errors } = validateForm(formData, {
    client_name: (value) => validateClientName({ clientName: value as string }),
    trip_date: (value) => validateDate({ date: value as string }),
    miles: (value) => validateMiles({ miles: value as number }),
  });

  return { isValid, errors: errors as FormErrors };
}

/**
 * Debounce utility for form inputs
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Helper to clear form errors for a specific field
 */
export function clearFieldError<T extends Record<string, string | undefined>>(
  errors: T,
  field: keyof T,
): T {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
}

/**
 * Helper to set a field error
 */
export function setFieldError<T extends Record<string, string | undefined>>(
  errors: T,
  field: keyof T,
  message: string,
): T {
  return {
    ...errors,
    [field]: message,
  };
}
