import React from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { FormField, Textarea } from "../ui";
import type { UseFormReturn } from "../../hooks/useForm";

interface NotesFieldProps<T extends Record<string, unknown>> {
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
  /** Number of rows for textarea */
  rows?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Helper text to display */
  helperText?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom ID for the field */
  id?: string;
  /** Whether to disable textarea resizing */
  noResize?: boolean;
}

/**
 * Specialized form field component for notes/textarea input
 */
export const NotesField = <T extends Record<string, unknown>>(
  props: NotesFieldProps<T> & { ref?: React.Ref<HTMLTextAreaElement> },
) => {
  const {
    form,
    fieldName,
    label = "Notes (Optional)",
    required = false,
    placeholder = "Trip details, purpose, etc.",
    rows = 3,
    maxLength,
    helperText,
    className = "",
    id,
    noResize = true,
    ref,
  } = props;
  const fieldId = id || `${String(fieldName)}-input`;
  const notesValue = (form.data[fieldName] as string) || "";

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    form.handleFieldChange(fieldName, value as T[keyof T]);
  };

  // Show character count if maxLength is specified (including 0)
  const effectiveHelperText =
    helperText ||
    (maxLength !== undefined
      ? `${notesValue.length}/${maxLength} characters`
      : undefined);

  return (
    <FormField
      label={label}
      required={required}
      error={form.getFieldError(fieldName)}
      helperText={effectiveHelperText}
      icon={DocumentTextIcon}
      id={fieldId}
      className={className}
    >
      <Textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        maxLength={maxLength}
        value={notesValue}
        onChange={handleNotesChange}
        hasIcon
        noResize={noResize}
        placeholder={placeholder}
        error={form.hasFieldError(fieldName)}
      />
    </FormField>
  );
};

NotesField.displayName = "NotesField";

export default NotesField;
