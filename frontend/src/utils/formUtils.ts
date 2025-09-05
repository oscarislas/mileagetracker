import type {
  FormErrors,
  CreateTripRequest,
  UpdateTripRequest,
  TripFormData,
  TripFormFieldConfigs,
} from "../types";

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
  if (!clientName || !clientName.trim()) {
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
 * Creates a comprehensive trip form validator for use with useForm hook
 */
export function createTripFormValidator<
  T extends CreateTripRequest | UpdateTripRequest,
>() {
  return (formData: T): Record<keyof T, string | undefined> => {
    const errors: Record<string, string | undefined> = {};

    errors.client_name = validateClientName({
      clientName: formData.client_name,
    });

    errors.trip_date = validateDate({
      date: formData.trip_date,
    });

    errors.miles = validateMiles({
      miles: formData.miles,
    });

    // Notes field doesn't need validation as it's optional
    errors.notes = undefined;

    return errors as Record<keyof T, string | undefined>;
  };
}

/**
 * Trip form validation helper (legacy - use createTripFormValidator with useForm hook)
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

/**
 * Form field change handler factory - creates handlers that automatically clear errors
 */
export function createFieldChangeHandler<T extends Record<string, unknown>>(
  setData: (data: Partial<T> | ((prev: T) => T)) => void,
  setErrors: (
    errors:
      | Partial<Record<keyof T, string>>
      | ((
          prev: Partial<Record<keyof T, string>>,
        ) => Partial<Record<keyof T, string>>),
  ) => void,
  field: keyof T,
) {
  return (value: T[keyof T]) => {
    setData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts changing it
    setErrors((prev: Partial<Record<keyof T, string>>) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };
}

/**
 * Enhanced form utilities for working with client suggestions
 */
export interface ClientSuggestionsIntegration {
  handleClientSelect: (clientName: string) => void;
  handleClientNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClientNameFocus: () => void;
  shouldShowSuggestions: boolean;
}

export function createClientSuggestionsIntegration<
  T extends Record<string, unknown>,
>(
  formData: T,
  setField: (field: keyof T, value: T[keyof T]) => void,
  clientSuggestions: {
    showSuggestionsDropdown: () => void;
    hideSuggestionsDropdown: () => void;
    handleClientSelect: (clientName: string) => void;
  },
  clientNameField: keyof T = "client_name" as keyof T,
): ClientSuggestionsIntegration {
  const handleClientSelect = (clientName: string) => {
    setField(clientNameField, clientName as T[keyof T]);
    clientSuggestions.handleClientSelect(clientName);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setField(clientNameField, value as T[keyof T]);
    if (value.length > 0) {
      clientSuggestions.showSuggestionsDropdown();
    } else {
      clientSuggestions.hideSuggestionsDropdown();
    }
  };

  const handleClientNameFocus = () => {
    const clientNameValue = String(formData[clientNameField] || "");
    if (clientNameValue.length > 0) {
      clientSuggestions.showSuggestionsDropdown();
    }
  };

  const shouldShowSuggestions =
    String(formData[clientNameField] || "").length > 0;

  return {
    handleClientSelect,
    handleClientNameChange,
    handleClientNameFocus,
    shouldShowSuggestions,
  };
}

/**
 * Standard trip form field configurations
 */
export const TRIP_FORM_FIELDS: TripFormFieldConfigs = {
  client_name: {
    label: "Client Name",
    required: true,
    placeholder: "Enter client name",
    maxLength: 30,
    type: "text",
  },
  trip_date: {
    label: "Trip Date",
    required: true,
    placeholder: "Select trip date",
    helperText: "💡 Select the date when your trip occurred",
    type: "date",
  },
  miles: {
    label: "Miles Driven",
    required: true,
    placeholder: "0.0",
    type: "number",
    step: "0.1",
    min: "0",
    inputMode: "decimal",
  },
  notes: {
    label: "Notes (Optional)",
    required: false,
    placeholder: "Trip details, purpose, etc.",
    type: "textarea",
  },
};

/**
 * Get initial form data for trip forms
 */
export function getInitialTripFormData(): TripFormData {
  return {
    client_name: "",
    trip_date: "", // Empty by default to encourage user selection
    miles: 0,
    notes: "",
  };
}

/**
 * Reset form data to initial state
 */
export function resetTripFormData(
  setFormData: (data: TripFormData) => void,
): void {
  setFormData(getInitialTripFormData());
}
