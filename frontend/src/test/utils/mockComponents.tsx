/**
 * Standardized mock components for testing
 *
 * This file provides factory functions and reusable mock component definitions
 * that match real component interfaces exactly. Designed to resolve test failures
 * related to accessibility queries like getByLabelText().
 *
 * Key features:
 * - Proper htmlFor attributes instead of for
 * - Full accessibility property support
 * - Event handler forwarding
 * - Component composition patterns
 * - Consistent prop interfaces matching real components
 */

/* eslint-disable react-refresh/only-export-components */

import React from "react";

// ============================================================================
// Type definitions for mock components
// ============================================================================

export interface MockFormFieldProps {
  /** Field label */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display below input */
  helperText?: string;
  /** Icon component to display in input */
  icon?: React.ComponentType<{ className?: string }>;
  /** Additional CSS classes */
  className?: string;
  /** Children (input element) */
  children: React.ReactNode;
  /** ID for accessibility - CRITICAL for getByLabelText() */
  id?: string;
}

export interface MockInputProps {
  /** Input ID - used for label association */
  id?: string;
  /** Input type */
  type?: string;
  /** Current value */
  value?: string | number;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input has an icon (affects padding) */
  hasIcon?: boolean;
  /** Whether input has an error state */
  error?: boolean;
  /** Input size variant */
  size?: "sm" | "md" | "lg";
  /** Minimum value for number inputs */
  min?: number;
  /** Step for number inputs */
  step?: string;
  /** Maximum length */
  maxLength?: number;
  /** Input mode for mobile keyboards */
  inputMode?:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** ARIA described by */
  "aria-describedby"?: string;
  /** Additional CSS classes */
  className?: string;
  /** Any additional props */
  [key: string]: unknown;
}

export interface MockTextareaProps {
  /** Textarea ID - used for label association */
  id?: string;
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  /** Focus handler */
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** Blur handler */
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether textarea has an icon (affects padding) */
  hasIcon?: boolean;
  /** Whether textarea has an error state */
  error?: boolean;
  /** Number of rows */
  rows?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Disable resize functionality */
  noResize?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Any additional props */
  [key: string]: unknown;
}

export interface MockButtonProps {
  /** Button type */
  type?: "button" | "submit" | "reset";
  /** Button variant */
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Whether button is in loading state */
  loading?: boolean;
  /** Icon to display before text */
  icon?: React.ComponentType<{ className?: string }>;
  /** Full width button */
  fullWidth?: boolean;
  /** Whether button is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS classes */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
  /** Any additional props */
  [key: string]: unknown;
}

export interface MockClientSuggestionsProps {
  /** Array of client suggestions to display */
  clients: Array<{ id: number | string; name: string }>;
  /** Whether to show the suggestions dropdown */
  show: boolean;
  /** Callback when a client is selected */
  onSelect: (clientName: string) => void;
  /** Maximum number of suggestions to display */
  maxItems?: number;
  /** Custom CSS classes */
  className?: string;
  /** Loading state for suggestions */
  isLoading?: boolean;
  /** No results message */
  noResultsMessage?: string;
  /** Current query for highlighting */
  query?: string;
  /** Position the dropdown above the input (default: false) */
  positionUp?: boolean;
}

export interface MockLoadingSpinnerProps {
  /** Spinner size */
  size?: "sm" | "md" | "lg";
  /** Spinner color */
  color?: "blue" | "white" | "gray";
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Factory functions for creating mock components
// ============================================================================

/**
 * Creates a mock FormField component with proper accessibility
 * Simplified structure to ensure React Testing Library can find labels correctly
 */
export const createMockFormField = (): React.FC<MockFormFieldProps> => {
  return ({
    children,
    label,
    error,
    helperText,
    className = "",
    id,
    required = false,
    icon: _Icon, // eslint-disable-line @typescript-eslint/no-unused-vars
  }) => (
    <div className={`form-field ${className}`.trim()} data-testid="form-field">
      <label htmlFor={id} className="form-field-label">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Simplified structure - put icon inside the input component if needed */}
      {children}

      {error && (
        <div
          className="form-field-error text-red-500"
          data-testid="form-field-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {helperText && !error && (
        <div
          className="form-field-helper text-gray-500"
          data-testid="form-field-helper"
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

/**
 * Creates a mock Input component with proper event handling and accessibility
 */
export const createMockInput = (): React.FC<MockInputProps> => {
  return React.forwardRef<HTMLInputElement, MockInputProps>(
    (
      {
        id,
        type = "text",
        value,
        onChange,
        onFocus,
        onBlur,
        placeholder,
        hasIcon = false,
        error = false,
        size = "md",
        min,
        step,
        maxLength,
        inputMode,
        required = false,
        disabled = false,
        className = "",
        ...props
      }: MockInputProps,
      ref,
    ) => {
      // Filter out custom props that shouldn't be passed to DOM elements
      const {
        hasIcon: _hasIcon,
        error: _error,
        size: _size,
        ...domProps
      } = props;
      void _hasIcon; // Avoid unused variable warning
      void _error; // Avoid unused variable warning
      void _size; // Avoid unused variable warning

      return (
        <div className="mock-input-wrapper">
          <input
            ref={ref}
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            min={min}
            step={step}
            maxLength={maxLength}
            inputMode={inputMode}
            required={required}
            disabled={disabled}
            className={`
            mock-input
            ${hasIcon ? "has-icon" : ""}
            ${error ? "error" : ""}
            ${size}
            ${className}
          `.trim()}
            data-testid="mock-input"
            {...domProps}
          />
        </div>
      );
    },
  );
};

/**
 * Creates a mock Textarea component with proper event handling and accessibility
 */
export const createMockTextarea = (): React.FC<MockTextareaProps> => {
  return React.forwardRef<HTMLTextAreaElement, MockTextareaProps>(
    (
      {
        id,
        value,
        onChange,
        onFocus,
        onBlur,
        placeholder,
        hasIcon = false,
        error = false,
        rows = 3,
        maxLength,
        noResize = false,
        required = false,
        disabled = false,
        className = "",
        ...props
      }: MockTextareaProps,
      ref,
    ) => {
      // Filter out custom props that shouldn't be passed to DOM elements
      const {
        hasIcon: _hasIcon,
        error: _error,
        noResize: _noResize,
        ...domProps
      } = props;
      void _hasIcon; // Avoid unused variable warning
      void _error; // Avoid unused variable warning
      void _noResize; // Avoid unused variable warning

      return (
        <textarea
          ref={ref}
          id={id}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          className={`
          mock-textarea
          ${hasIcon ? "has-icon" : ""}
          ${error ? "error" : ""}
          ${noResize ? "no-resize" : ""}
          ${className}
        `.trim()}
          data-testid="mock-textarea"
          {...domProps}
        />
      );
    },
  );
};

/**
 * Creates a mock Button component with proper event handling
 */
export const createMockButton = (): React.FC<MockButtonProps> => {
  return React.forwardRef<HTMLButtonElement, MockButtonProps>(
    (
      {
        type = "button",
        variant = "primary",
        size = "md",
        loading = false,
        icon: Icon,
        fullWidth = false,
        disabled = false,
        onClick,
        className = "",
        children,
        ...props
      }: MockButtonProps,
      ref,
    ) => (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={`
        mock-button
        ${variant}
        ${size}
        ${fullWidth ? "full-width" : ""}
        ${loading ? "loading" : ""}
        ${className}
      `.trim()}
        data-testid="mock-button"
        {...props}
      >
        {loading ? (
          <span data-testid="loading-indicator">Loading...</span>
        ) : Icon ? (
          React.createElement(Icon, { className: "button-icon" })
        ) : null}
        {children}
      </button>
    ),
  );
};

/**
 * Creates a mock ClientSuggestions component
 */
export const createMockClientSuggestions =
  (): React.FC<MockClientSuggestionsProps> => {
    return React.forwardRef<HTMLDivElement, MockClientSuggestionsProps>(
      (
        {
          clients,
          show,
          onSelect,
          maxItems = 5,
          className = "",
          isLoading = false,
          noResultsMessage = "No clients found",
          query: _query = "", // eslint-disable-line @typescript-eslint/no-unused-vars
          positionUp = false,
        },
        ref,
      ) => {
        if (!show) return null;

        const displayedClients = clients.slice(0, maxItems);

        return (
          <div
            ref={ref}
            className={`
          mock-client-suggestions
          ${positionUp ? "position-up" : "position-down"}
          ${className}
        `.trim()}
            data-testid="client-suggestions"
            role="listbox"
            aria-label="Client suggestions"
          >
            {isLoading ? (
              <div data-testid="suggestions-loading">Loading clients...</div>
            ) : displayedClients.length > 0 ? (
              <>
                <div
                  className="suggestions-header"
                  data-testid="suggestions-header"
                >
                  Recent clients
                </div>
                {displayedClients.map((client, index) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelect(client.name)}
                    className="suggestion-item"
                    data-testid={`suggestion-${index}`}
                    role="option"
                    aria-selected={false}
                  >
                    <span className="client-icon" data-testid="client-icon">
                      👤
                    </span>
                    <span className="client-name">{client.name}</span>
                  </button>
                ))}
              </>
            ) : (
              <div className="no-results" data-testid="no-results">
                <div>{noResultsMessage}</div>
                <div>Try a different search term</div>
              </div>
            )}
          </div>
        );
      },
    );
  };

/**
 * Creates a mock LoadingSpinner component
 */
export const createMockLoadingSpinner =
  (): React.FC<MockLoadingSpinnerProps> => {
    return ({ size = "md", color = "blue", className = "" }) => (
      <div
        className={`
        mock-loading-spinner
        ${size}
        ${color}
        ${className}
      `.trim()}
        data-testid="loading-spinner"
        role="status"
        aria-label="Loading"
      >
        <span>⏳</span>
      </div>
    );
  };

// ============================================================================
// Pre-configured mock components ready for use
// ============================================================================

export const MockFormField = createMockFormField();
export const MockInput = createMockInput();
export const MockTextarea = createMockTextarea();
export const MockButton = createMockButton();
export const MockClientSuggestions = createMockClientSuggestions();
export const MockLoadingSpinner = createMockLoadingSpinner();

// ============================================================================
// Complete UI component mocks object for vi.mock()
// ============================================================================

/**
 * Complete mock object for all UI components
 * Usage: vi.mock("../../ui", () => createMockUIComponents())
 */
export const createMockUIComponents = () => ({
  FormField: MockFormField,
  Input: MockInput,
  Textarea: MockTextarea,
  Button: MockButton,
  ClientSuggestions: MockClientSuggestions,
  LoadingSpinner: MockLoadingSpinner,
});

// ============================================================================
// Specialized mock factories for form field components
// ============================================================================

/**
 * Creates a mock for form field components that use FormField + Input/Textarea
 */
export const createMockFormFieldComponent =
  <T extends Record<string, unknown>>() =>
  ({
    form,
    fieldName,
    label = "Test Field",
    required = false,
    placeholder = "Enter value",
    className = "",
    id,
    ...props
  }: {
    form: {
      data: T;
      getFieldError: (field: keyof T) => string | undefined;
      hasFieldError: (field: keyof T) => boolean;
      handleFieldChange: (field: keyof T, value: T[keyof T]) => void;
    };
    fieldName: keyof T;
    label?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
    id?: string;
    [key: string]: unknown;
  }) => {
    const fieldId = id || `${String(fieldName)}-input`;
    const value = form.data[fieldName];
    const error = form.getFieldError(fieldName);
    const hasError = form.hasFieldError(fieldName);

    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      const newValue = e.target.value;
      form.handleFieldChange(fieldName, newValue as T[keyof T]);
    };

    return (
      <div className={`mock-form-field-component ${className}`.trim()}>
        <label htmlFor={fieldId}>
          {label}
          {required && <span className="required">*</span>}
        </label>

        <input
          id={fieldId}
          value={String(value || "")}
          onChange={handleChange}
          placeholder={placeholder}
          className={hasError ? "error" : ""}
          data-testid={`mock-${String(fieldName)}-field`}
          // Filter out non-DOM props before spreading
          {...Object.fromEntries(
            Object.entries(props).filter(
              ([key]) =>
                !["hasIcon", "error", "size", "noResize"].includes(key),
            ),
          )}
        />

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  };

/**
 * Pre-configured mock for ClientNameField
 */
export const MockClientNameField = createMockFormFieldComponent();

/**
 * Pre-configured mock for DateField
 */
export const MockDateField = createMockFormFieldComponent();

/**
 * Pre-configured mock for MilesField
 */
export const MockMilesField = createMockFormFieldComponent();

/**
 * Pre-configured mock for NotesField with textarea
 */
export const MockNotesField = <T extends Record<string, unknown>>({
  form,
  fieldName,
  label = "Notes (Optional)",
  required = false,
  placeholder = "Enter notes",
  className = "",
  id,
  rows = 3,
  ...props
}: {
  form: {
    data: T;
    getFieldError: (field: keyof T) => string | undefined;
    hasFieldError: (field: keyof T) => boolean;
    handleFieldChange: (field: keyof T, value: T[keyof T]) => void;
  };
  fieldName: keyof T;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  rows?: number;
  [key: string]: unknown;
}) => {
  const fieldId = id || `${String(fieldName)}-input`;
  const value = form.data[fieldName];
  const error = form.getFieldError(fieldName);
  const hasError = form.hasFieldError(fieldName);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    form.handleFieldChange(fieldName, newValue as T[keyof T]);
  };

  return (
    <div className={`mock-notes-field-component ${className}`.trim()}>
      <label htmlFor={fieldId}>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <textarea
        id={fieldId}
        value={String(value || "")}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className={hasError ? "error" : ""}
        data-testid={`mock-${String(fieldName)}-field`}
        // Filter out non-DOM props before spreading
        {...Object.fromEntries(
          Object.entries(props).filter(
            ([key]) => !["hasIcon", "error", "size", "noResize"].includes(key),
          ),
        )}
      />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Helper functions for test utilities
// ============================================================================

/**
 * Creates a comprehensive mock object for form field components
 */
export const createFormFieldMocks = () => ({
  ClientNameField: MockClientNameField,
  DateField: MockDateField,
  MilesField: MockMilesField,
  NotesField: MockNotesField,
});

/**
 * Utility to get mock component with proper TypeScript support
 */
export const getMockComponent = <
  T extends keyof ReturnType<typeof createMockUIComponents>,
>(
  componentName: T,
): ReturnType<typeof createMockUIComponents>[T] => {
  const mocks = createMockUIComponents();
  return mocks[componentName];
};
