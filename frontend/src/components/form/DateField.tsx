import React from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { FormField, Input } from "../ui";
import type { UseFormReturn } from "../../hooks/useForm";

interface DateFieldProps<T extends Record<string, unknown>> {
  /** Form management object from useForm hook */
  form: UseFormReturn<T>;
  /** Field name in the form data */
  fieldName: keyof T;
  /** Label for the field */
  label?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Helper text to display */
  helperText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom ID for the field */
  id?: string;
  /** Default to today's date when empty */
  defaultToToday?: boolean;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Specialized form field component for date input with consistent handling
 */
export const DateField = <T extends Record<string, unknown>>(
  props: DateFieldProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => {
  const {
    form,
    fieldName,
    label = "Date",
    required = false,
    helperText,
    className = "",
    id,
    defaultToToday = false,
    ref,
  } = props;
  const fieldId = id || `${String(fieldName)}-input`;
  const dateValue = (form.data[fieldName] as string) || "";

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.handleFieldChange(fieldName, value as T[keyof T]);
  };

  // Auto-set today's date if field is empty and defaultToToday is true
  const handleDateFocus = () => {
    if (defaultToToday && !dateValue) {
      form.handleFieldChange(fieldName, getTodayDateString() as T[keyof T]);
    }
  };

  // Generate helper text with tip if no custom helper text provided
  const effectiveHelperText =
    helperText ||
    (!dateValue && !form.getFieldError(fieldName)
      ? "💡 Select the date when this occurred"
      : undefined);

  return (
    <FormField
      label={label}
      required={required}
      error={form.getFieldError(fieldName)}
      helperText={effectiveHelperText}
      icon={CalendarIcon}
      id={fieldId}
      className={className}
    >
      <Input
        ref={ref}
        type="date"
        id={fieldId}
        value={dateValue}
        onChange={handleDateChange}
        onFocus={handleDateFocus}
        hasIcon
        error={form.hasFieldError(fieldName)}
        placeholder="Select date"
      />
    </FormField>
  );
};

DateField.displayName = "DateField";

export default DateField;
