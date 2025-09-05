import React from "react";
import { UserIcon } from "@heroicons/react/24/outline";
import { useClientSuggestions } from "../../hooks/useClientSuggestions";
import { FormField, Input, ClientSuggestions } from "../ui";
import type { UseFormReturn } from "../../hooks/useForm";

interface ClientNameFieldProps<T extends Record<string, unknown>> {
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
  /** Maximum length for input */
  maxLength?: number;
  /** Additional CSS classes */
  className?: string;
  /** Helper text to display */
  helperText?: string;
  /** Custom ID for the field */
  id?: string;
  /** Position client suggestions upward (for modal mode) */
  positionUp?: boolean;
}

/**
 * Specialized form field component for client name input with integrated suggestions
 */
export const ClientNameField = <T extends Record<string, unknown>>(
  props: ClientNameFieldProps<T> & { ref?: React.Ref<HTMLInputElement> },
) => {
  const {
    form,
    fieldName,
    label = "Client Name",
    required = false,
    placeholder = "Enter client name",
    maxLength = 30,
    className = "",
    helperText,
    id,
    positionUp = false,
    ref,
  } = props;
  const fieldId = id || `${String(fieldName)}-input`;
  const clientName = (form.data[fieldName] as string) || "";
  const clientSuggestions = useClientSuggestions(clientName);

  const handleClientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.handleFieldChange(fieldName, value as T[keyof T]);

    if (value.length > 0) {
      clientSuggestions.showSuggestionsDropdown();
    } else {
      clientSuggestions.hideSuggestionsDropdown();
    }
  };

  const handleClientNameFocus = () => {
    if (clientName.length > 0) {
      clientSuggestions.showSuggestionsDropdown();
    }
  };

  const handleClientSelect = (selectedClientName: string) => {
    form.handleFieldChange(fieldName, selectedClientName as T[keyof T]);
    clientSuggestions.handleClientSelect(selectedClientName);
  };

  return (
    <FormField
      label={label}
      required={required}
      error={form.getFieldError(fieldName)}
      helperText={helperText}
      icon={UserIcon}
      id={fieldId}
      className={className}
    >
      <div className="relative">
        <Input
          ref={ref || clientSuggestions.inputRef}
          id={fieldId}
          maxLength={maxLength}
          value={clientName}
          onChange={handleClientNameChange}
          onFocus={handleClientNameFocus}
          hasIcon
          error={form.hasFieldError(fieldName)}
          placeholder={placeholder}
          aria-describedby="client-suggestions"
        />

        <ClientSuggestions
          ref={clientSuggestions.suggestionsRef}
          clients={clientSuggestions.suggestions?.data?.clients || []}
          show={clientSuggestions.showSuggestions}
          onSelect={handleClientSelect}
          isLoading={clientSuggestions.suggestions?.isLoading}
          query={clientName}
          noResultsMessage="No matching clients found"
          positionUp={positionUp}
        />
      </div>
    </FormField>
  );
};

ClientNameField.displayName = "ClientNameField";

export default ClientNameField;
