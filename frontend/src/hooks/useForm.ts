import { useState, useCallback } from "react";

export interface UseFormOptions<T> {
  /** Initial form data */
  initialData: T;
  /** Validation function */
  validate?: (data: T) => Record<keyof T, string | undefined>;
  /** Success callback */
  onSubmit?: (data: T) => void | Promise<void>;
  /** Reset form after successful submission */
  resetOnSuccess?: boolean;
  /** Transform data before submission */
  transformBeforeSubmit?: (data: T) => T;
}

export interface UseFormReturn<T> {
  /** Current form data */
  data: T;
  /** Form errors */
  errors: Partial<Record<keyof T, string>>;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form has been submitted */
  isSubmitted: boolean;
  /** Whether form is valid (only available after validation) */
  isValid: boolean;
  /** Update a field value */
  setField: (field: keyof T, value: T[keyof T]) => void;
  /** Update multiple fields */
  setData: (data: Partial<T> | ((prev: T) => T)) => void;
  /** Set form errors */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear error for specific field */
  clearFieldError: (field: keyof T) => void;
  /** Reset form to initial state */
  reset: () => void;
  /** Validate form */
  validateForm: () => boolean;
  /** Handle form submission */
  handleSubmit: (e?: React.FormEvent) => Promise<boolean>;
  /** Check if form has changes */
  isDirty: boolean;
  /** Get field error helper */
  getFieldError: (field: keyof T) => string | undefined;
  /** Check if field has error */
  hasFieldError: (field: keyof T) => boolean;
  /** Handle field change with automatic error clearing */
  handleFieldChange: (field: keyof T, value: T[keyof T]) => void;
}

/**
 * Reusable form management hook
 */
export function useForm<T extends Record<string, unknown>>({
  initialData,
  validate,
  onSubmit,
  resetOnSuccess = true,
  transformBeforeSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [data, setDataState] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const setField = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setDataState((prev) => ({ ...prev, [field]: value }));
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors],
  );

  const setData = useCallback((newData: Partial<T> | ((prev: T) => T)) => {
    if (typeof newData === "function") {
      setDataState(newData);
    } else {
      setDataState((prev) => ({ ...prev, ...newData }));
    }
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const reset = useCallback(() => {
    setDataState(initialData);
    setErrors({});
    setIsSubmitting(false);
    setIsSubmitted(false);
    setIsValid(true);
  }, [initialData]);

  const validateForm = useCallback((): boolean => {
    if (!validate) {
      setIsValid(true);
      return true;
    }

    const validationErrors = validate(data);
    const filteredErrors = Object.entries(validationErrors)
      .filter(([, error]) => error !== undefined)
      .reduce(
        (acc, [field, error]) => ({
          ...acc,
          [field]: error,
        }),
        {} as Record<keyof T, string>,
      );

    setErrors(filteredErrors);
    const isFormValid = Object.keys(filteredErrors).length === 0;
    setIsValid(isFormValid);
    return isFormValid;
  }, [data, validate]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      if (e) {
        e.preventDefault();
      }

      setIsSubmitted(true);
      if (!validateForm()) {
        return false;
      }

      if (!onSubmit) {
        return true;
      }

      setIsSubmitting(true);
      try {
        const submitData = transformBeforeSubmit
          ? transformBeforeSubmit(data)
          : data;
        await onSubmit(submitData);
        if (resetOnSuccess) {
          reset();
        }
        return true;
      } catch (error) {
        console.error("Form submission error:", error);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      data,
      validateForm,
      onSubmit,
      transformBeforeSubmit,
      resetOnSuccess,
      reset,
    ],
  );

  const isDirty = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(initialData);
  }, [data, initialData])();

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return errors[field];
    },
    [errors],
  );

  const hasFieldError = useCallback(
    (field: keyof T): boolean => {
      return !!errors[field];
    },
    [errors],
  );

  const handleFieldChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setField(field, value);
    },
    [setField],
  );

  return {
    data,
    errors,
    isSubmitting,
    isSubmitted,
    isValid,
    setField,
    setData,
    setErrors,
    clearErrors,
    clearFieldError,
    reset,
    validateForm,
    handleSubmit,
    isDirty,
    getFieldError,
    hasFieldError,
    handleFieldChange,
  };
}

export default useForm;
