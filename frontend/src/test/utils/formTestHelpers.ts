import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./testUtils";
import type { ReactElement } from "react";
import type { UseFormReturn, UseFormOptions } from "../../hooks/useForm";
import { useForm } from "../../hooks/useForm";
import { renderHook } from "@testing-library/react";

/**
 * Form testing utilities to handle complex form state interactions
 * and address common testing issues with form state synchronization
 */

// Types for form testing utilities
export interface FormTestState {
  data: Record<string, unknown>;
  errors: Record<string, string | undefined>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface SimulateInputOptions {
  /** Clear the input before typing */
  clear?: boolean;
  /** Submit after typing (press Enter) */
  submit?: boolean;
  /** Type slowly character by character for complex form interactions */
  slowly?: boolean;
  /** Delay between characters when typing slowly (ms) */
  delay?: number;
}

export interface FormAssertionOptions {
  /** Timeout for async form operations */
  timeout?: number;
  /** Whether to ignore whitespace in comparisons */
  ignoreWhitespace?: boolean;
  /** Custom error message for failed assertions */
  errorMessage?: string;
}

/**
 * Simulates realistic user input that properly handles form state updates
 * Addresses issues with single character input capture and async state updates
 */
export async function simulateUserInput(
  element: HTMLElement,
  text: string,
  options: SimulateInputOptions = {},
): Promise<void> {
  const { clear = false, submit = false, slowly = false, delay = 50 } = options;

  const user = userEvent.setup({ delay: slowly ? delay : null });

  await act(async () => {
    if (clear) {
      await user.clear(element);
    }

    if (slowly) {
      // Type character by character for complex form interactions
      for (let i = 0; i < text.length; i++) {
        await user.type(element, text[i]);
        // Small delay to ensure form state updates between characters
        await waitFor(() => {}, { timeout: 10 });
      }
    } else {
      // Type entire string at once for simpler interactions
      await user.type(element, text);
    }

    if (submit) {
      await user.type(element, "{Enter}");
    }
  });

  // Wait for form state to stabilize
  await waitFor(() => {}, { timeout: 100 });
}

/**
 * Renders a component with form provider context and proper error boundary
 * Provides consistent setup for form testing scenarios
 */
export function renderWithFormProvider(ui: ReactElement) {
  // For now, just use the standard render with providers
  // Additional providers functionality can be extended later if needed
  return renderWithProviders(ui);
}

/**
 * Waits for form state updates with proper act() wrapping
 * Addresses async form state synchronization issues
 */
export async function waitForFormUpdate<T extends Record<string, unknown>>(
  formHook: UseFormReturn<T>,
  condition: (formState: FormTestState) => boolean,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;

  await act(async () => {
    await waitFor(
      () => {
        const formState: FormTestState = {
          data: formHook.data as Record<string, unknown>,
          errors: formHook.errors as Record<string, string | undefined>,
          isSubmitting: formHook.isSubmitting,
          isValid: formHook.isValid,
          isDirty: formHook.isDirty,
        };

        if (!condition(formState)) {
          throw new Error("Form state condition not met");
        }
      },
      { timeout, interval },
    );
  });
}

/**
 * Creates a form hook for testing with proper setup and cleanup
 */
export function createTestFormHook<T extends Record<string, unknown>>(
  options: UseFormOptions<T>,
) {
  return renderHook(() => useForm(options));
}

/**
 * Form assertion utilities for consistent testing
 */
export const formAssert = {
  /**
   * Asserts form field has expected value
   */
  async fieldHasValue(
    fieldElement: HTMLElement | string,
    expectedValue: string,
    options: FormAssertionOptions = {},
  ): Promise<void> {
    const { timeout = 1000, ignoreWhitespace = false, errorMessage } = options;

    const element =
      typeof fieldElement === "string"
        ? screen.getByLabelText(new RegExp(fieldElement, "i"))
        : fieldElement;

    await waitFor(
      () => {
        const actualValue = (element as HTMLInputElement).value;
        const normalizedActual = ignoreWhitespace
          ? actualValue.trim()
          : actualValue;
        const normalizedExpected = ignoreWhitespace
          ? expectedValue.trim()
          : expectedValue;

        if (normalizedActual !== normalizedExpected) {
          throw new Error(
            errorMessage ||
              `Expected field to have value "${normalizedExpected}" but got "${normalizedActual}"`,
          );
        }
      },
      { timeout },
    );
  },

  /**
   * Asserts form has specific validation errors
   */
  async hasValidationErrors(
    expectedErrors: Record<string, string | RegExp>,
    options: FormAssertionOptions = {},
  ): Promise<void> {
    const { timeout = 1000, errorMessage } = options;

    await waitFor(
      () => {
        for (const [fieldName, expectedError] of Object.entries(
          expectedErrors,
        )) {
          const errorElement =
            document.querySelector(`[data-testid="${fieldName}-error"]`) ||
            document.querySelector(`[aria-describedby*="${fieldName}"]`);

          if (!errorElement) {
            throw new Error(
              errorMessage ||
                `Expected validation error for field "${fieldName}" but no error element found`,
            );
          }

          const errorText = errorElement.textContent || "";

          if (expectedError instanceof RegExp) {
            if (!expectedError.test(errorText)) {
              throw new Error(
                errorMessage ||
                  `Expected error for "${fieldName}" to match ${expectedError} but got "${errorText}"`,
              );
            }
          } else {
            if (!errorText.includes(expectedError)) {
              throw new Error(
                errorMessage ||
                  `Expected error for "${fieldName}" to contain "${expectedError}" but got "${errorText}"`,
              );
            }
          }
        }
      },
      { timeout },
    );
  },

  /**
   * Asserts form submission state
   */
  async isSubmitting(
    isSubmitting: boolean,
    options: FormAssertionOptions = {},
  ): Promise<void> {
    const { timeout = 1000, errorMessage } = options;

    await waitFor(
      () => {
        const submitButton =
          document.querySelector('[type="submit"]') ||
          document.querySelector("button[form]") ||
          screen.queryByRole("button", { name: /submit|add|save|create/i });

        if (!submitButton) {
          throw new Error("No submit button found for submission state check");
        }

        const buttonDisabled = submitButton.hasAttribute("disabled");
        const hasSpinner = submitButton.querySelector(".animate-spin") !== null;
        const submittingState = buttonDisabled && hasSpinner;

        if (submittingState !== isSubmitting) {
          throw new Error(
            errorMessage ||
              `Expected form ${isSubmitting ? "to be" : "not to be"} submitting but got opposite state`,
          );
        }
      },
      { timeout },
    );
  },

  /**
   * Asserts form is in valid/invalid state
   */
  async isValid(
    isValid: boolean,
    options: FormAssertionOptions = {},
  ): Promise<void> {
    const { timeout = 1000, errorMessage } = options;

    await waitFor(
      () => {
        const submitButton =
          document.querySelector('[type="submit"]') ||
          document.querySelector("button[form]");
        const errorElements = document.querySelectorAll(
          "[data-testid*='-error'], .text-red-500, .error",
        );

        // Check multiple indicators of form validity
        const hasVisibleErrors = Array.from(errorElements).some(
          (el) => el.textContent && el.textContent.trim() !== "",
        );
        const submitButtonDisabled =
          submitButton?.hasAttribute("disabled") || false;

        // Form is considered invalid if it has visible errors or submit is disabled (excluding loading states)
        const hasSpinner =
          submitButton?.querySelector(".animate-spin") !== null;
        const formIsValid =
          !hasVisibleErrors && (!submitButtonDisabled || hasSpinner);

        if (formIsValid !== isValid) {
          throw new Error(
            errorMessage ||
              `Expected form to be ${isValid ? "valid" : "invalid"} but got opposite state. ` +
                `Errors: ${hasVisibleErrors}, Submit disabled: ${submitButtonDisabled}`,
          );
        }
      },
      { timeout },
    );
  },

  /**
   * Asserts button state (enabled/disabled)
   */
  async buttonIsEnabled(
    buttonSelector: string | RegExp,
    isEnabled: boolean,
    options: FormAssertionOptions = {},
  ): Promise<void> {
    const { timeout = 1000, errorMessage } = options;

    await waitFor(
      () => {
        const button =
          typeof buttonSelector === "string"
            ? document.querySelector(buttonSelector)
            : screen.getByRole("button", { name: buttonSelector });

        if (!button) {
          throw new Error(`Button with selector "${buttonSelector}" not found`);
        }

        const buttonEnabled = !button.hasAttribute("disabled");

        if (buttonEnabled !== isEnabled) {
          throw new Error(
            errorMessage ||
              `Expected button to be ${isEnabled ? "enabled" : "disabled"} but got opposite state`,
          );
        }
      },
      { timeout },
    );
  },
};

/**
 * Helper to create form data with proper typing
 */
export function createFormData<T extends Record<string, unknown>>(
  initialData: T,
  overrides: Partial<T> = {},
): T {
  return { ...initialData, ...overrides };
}

/**
 * Helper to simulate complete form workflow
 */
export async function simulateFormWorkflow(
  formFields: Array<{
    selector: string | HTMLElement;
    value: string;
    options?: SimulateInputOptions;
  }>,
  submitButtonSelector?: string | RegExp,
): Promise<void> {
  // Fill all form fields
  for (const field of formFields) {
    const element =
      typeof field.selector === "string"
        ? screen.getByLabelText(new RegExp(field.selector, "i"))
        : field.selector;

    await simulateUserInput(element, field.value, field.options);
  }

  // Submit form if requested
  if (submitButtonSelector) {
    const submitButton =
      typeof submitButtonSelector === "string"
        ? document.querySelector(submitButtonSelector)
        : screen.getByRole("button", { name: submitButtonSelector });

    if (submitButton) {
      const user = userEvent.setup();
      await act(async () => {
        await user.click(submitButton);
      });
    }
  }
}

/**
 * Debug helper to log current form state
 */
export function debugFormState<T extends Record<string, unknown>>(
  formHook: UseFormReturn<T>,
  message = "Current form state:",
): void {
  console.log(message, {
    data: formHook.data,
    errors: formHook.errors,
    isSubmitting: formHook.isSubmitting,
    isValid: formHook.isValid,
    isDirty: formHook.isDirty,
    isSubmitted: formHook.isSubmitted,
  });
}

/**
 * Helper to wait for form to reach specific step/state
 */
export async function waitForFormStep(
  stepIndicator: string | (() => boolean),
  options: { timeout?: number; interval?: number } = {},
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;

  await act(async () => {
    await waitFor(
      () => {
        if (typeof stepIndicator === "string") {
          const element =
            document.querySelector(stepIndicator) ||
            screen.queryByText(new RegExp(stepIndicator, "i"));
          if (!element) {
            throw new Error(`Step indicator "${stepIndicator}" not found`);
          }
        } else {
          if (!stepIndicator()) {
            throw new Error("Step condition not met");
          }
        }
      },
      { timeout, interval },
    );
  });
}

// Export commonly used testing patterns
export const formTestPatterns = {
  /**
   * Test pattern for form validation
   */
  async testFieldValidation(
    fieldSelector: string,
    validValue: string,
    invalidValues: Array<{ value: string; expectedError: string | RegExp }>,
  ): Promise<void> {
    const field = screen.getByLabelText(new RegExp(fieldSelector, "i"));

    // Test invalid values
    for (const { value, expectedError } of invalidValues) {
      await simulateUserInput(field, value, { clear: true });

      if (typeof expectedError === "string") {
        await waitFor(() => {
          expect(
            screen.getByText(new RegExp(expectedError, "i")),
          ).toBeInTheDocument();
        });
      } else {
        await waitFor(() => {
          const errorElement = document.querySelector(
            "[data-testid*='-error']",
          );
          expect(errorElement?.textContent).toMatch(expectedError);
        });
      }
    }

    // Test valid value
    await simulateUserInput(field, validValue, { clear: true });
    await waitFor(() => {
      const errorElements = document.querySelectorAll(
        "[data-testid*='-error']",
      );
      const hasVisibleErrors = Array.from(errorElements).some(
        (el) => el.textContent && el.textContent.trim() !== "",
      );
      expect(hasVisibleErrors).toBe(false);
    });
  },

  /**
   * Test pattern for multi-step forms
   */
  async testMultiStepForm(
    steps: Array<{
      stepName: string;
      fields: Array<{ selector: string; value: string }>;
      nextButtonSelector?: string;
      validationChecks?: Array<() => void | Promise<void>>;
    }>,
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Wait for step to be visible
      await waitForFormStep(step.stepName);

      // Fill fields for this step
      for (const field of step.fields) {
        const element = screen.getByLabelText(new RegExp(field.selector, "i"));
        await simulateUserInput(element, field.value);
      }

      // Run validation checks if any
      if (step.validationChecks) {
        for (const check of step.validationChecks) {
          await check();
        }
      }

      // Move to next step if not the last step
      if (i < steps.length - 1 && step.nextButtonSelector) {
        const nextButton = screen.getByRole("button", {
          name: new RegExp(step.nextButtonSelector, "i"),
        });
        const user = userEvent.setup();
        await act(async () => {
          await user.click(nextButton);
        });
      }
    }
  },
};
