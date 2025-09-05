import React from "react";
import { TruckIcon } from "@heroicons/react/24/outline";
import { FormField, Input } from "../ui";
import type { UseFormReturn } from "../../hooks/useForm";

interface MilesFieldProps<T extends Record<string, unknown>> {
  /** Form management object from useForm hook */
  form: UseFormReturn<T>;
  /** Field name in the form data */
  fieldName: keyof T;
  /** Label for the field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value */
  min?: number;
  /** Step for decimal input */
  step?: string;
  /** Helper text to display */
  helperText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom ID for the field */
  id?: string;
}

/**
 * Specialized form field component for miles input with numeric validation
 */
export const MilesField = <T extends Record<string, unknown>>(
  props: MilesFieldProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => {
  const {
    form,
    fieldName,
    label = "Miles Driven",
    required = false,
    placeholder = "0.0",
    min = 0,
    step = "0.1",
    helperText,
    className = "",
    id,
    ref,
  } = props;
  const fieldId = id || `${String(fieldName)}-input`;
  const milesValue = form.data[fieldName] as number;

  const handleMilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Handle empty string or convert to number
    const numericValue = value === "" ? 0 : parseFloat(value);
    // Ensure we don't set NaN
    const sanitizedValue = isNaN(numericValue) ? 0 : numericValue;

    form.handleFieldChange(fieldName, sanitizedValue as T[keyof T]);
  };

  // Format value for display (empty string if 0 for better UX)
  const displayValue = milesValue === 0 ? "" : milesValue.toString();

  return (
    <FormField
      label={label}
      required={required}
      error={form.getFieldError(fieldName)}
      helperText={helperText}
      icon={TruckIcon}
      id={fieldId}
      className={className}
    >
      <Input
        ref={ref}
        type="number"
        id={fieldId}
        step={step}
        min={min}
        inputMode="decimal"
        value={displayValue}
        onChange={handleMilesChange}
        hasIcon
        error={form.hasFieldError(fieldName)}
        placeholder={placeholder}
        aria-describedby={`${fieldId}-help`}
      />
    </FormField>
  );
};

MilesField.displayName = "MilesField";

export default MilesField;
