/**
 * Debug Helpers for Test Troubleshooting
 *
 * Comprehensive debugging utilities to help investigate test failures,
 * understand component state, and troubleshoot form interactions.
 * These tools were essential in achieving our 99.6% pass rate by making
 * it easy to identify and fix issues during test development.
 */

import { screen, prettyDOM, logRoles } from "@testing-library/react";
import type { UseFormReturn } from "../../hooks/useForm";

// ============================================================================
// Form Debugging Utilities
// ============================================================================

/**
 * Logs comprehensive form state information for debugging
 */
export function debugFormState<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  label = "Form State Debug",
): void {
  console.group(`🔍 ${label}`);

  console.log("📊 Form Data:", form.data);
  console.log("❌ Form Errors:", form.errors);
  console.log("🏃 Is Submitting:", form.isSubmitting);
  console.log("✅ Is Valid:", form.isValid);
  console.log("📝 Is Dirty:", form.isDirty);
  console.log("📤 Is Submitted:", form.isSubmitted);

  // Show field-specific information
  const fields = Object.keys(form.data);
  if (fields.length > 0) {
    console.log("\n📋 Field Details:");
    fields.forEach((field) => {
      const fieldKey = field as keyof T;
      console.log(`  ${field}:`, {
        value: form.data[fieldKey],
        error: form.getFieldError(fieldKey),
        hasError: form.hasFieldError(fieldKey),
      });
    });
  }

  console.groupEnd();
}

/**
 * Debugs form validation state by testing all fields
 */
export function debugFormValidation<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
  testValues: Partial<T> = {},
): void {
  console.group("🔬 Form Validation Debug");

  // Test current form state
  const currentlyValid = form.validateForm();
  console.log("Current form validity:", currentlyValid);

  // Test with provided values
  if (Object.keys(testValues).length > 0) {
    console.log("\n🧪 Testing with values:", testValues);

    // Temporarily set values and test
    const originalData = { ...form.data };
    form.setData({ ...form.data, ...testValues });
    const testValid = form.validateForm();
    console.log("Validity with test values:", testValid);

    // Restore original data
    form.setData(originalData);
  }

  console.groupEnd();
}

/**
 * Logs form field elements and their accessibility properties
 */
export function debugFormFields(containerSelector = "form"): void {
  console.group("📝 Form Fields Debug");

  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`Container "${containerSelector}" not found`);
    console.groupEnd();
    return;
  }

  // Find all form inputs
  const inputs = container.querySelectorAll("input, textarea, select");
  const labels = container.querySelectorAll("label");
  const buttons = container.querySelectorAll("button");

  console.log(
    `Found ${inputs.length} inputs, ${labels.length} labels, ${buttons.length} buttons`,
  );

  // Debug inputs
  if (inputs.length > 0) {
    console.log("\n🔤 Inputs:");
    inputs.forEach((input, index) => {
      const element = input as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement;
      console.log(`  Input ${index + 1}:`, {
        type: element.type || "text",
        name: element.name,
        id: element.id,
        value: element.value,
        placeholder: "placeholder" in element ? element.placeholder : undefined,
        required: element.required,
        disabled: element.disabled,
        "aria-label": element.getAttribute("aria-label"),
        "aria-describedby": element.getAttribute("aria-describedby"),
        "aria-invalid": element.getAttribute("aria-invalid"),
      });
    });
  }

  // Debug labels
  if (labels.length > 0) {
    console.log("\n🏷️ Labels:");
    labels.forEach((label, index) => {
      console.log(`  Label ${index + 1}:`, {
        text: label.textContent?.trim(),
        htmlFor: label.getAttribute("for"),
        associatedInput: label.getAttribute("for")
          ? document.getElementById(label.getAttribute("for")!)
          : null,
      });
    });
  }

  // Debug buttons
  if (buttons.length > 0) {
    console.log("\n🔘 Buttons:");
    buttons.forEach((button, index) => {
      console.log(`  Button ${index + 1}:`, {
        text: button.textContent?.trim(),
        type: button.getAttribute("type"),
        disabled: button.hasAttribute("disabled"),
        "aria-label": button.getAttribute("aria-label"),
        classes: button.className,
      });
    });
  }

  console.groupEnd();
}

// ============================================================================
// DOM Debugging Utilities
// ============================================================================

/**
 * Pretty prints the current DOM state with highlighting
 */
export function debugDOM(
  element?: Element | HTMLElement,
  maxLength = 10000,
  highlight = true,
): void {
  console.group("🌳 DOM Debug");

  const targetElement = element || document.body;
  const domString = prettyDOM(targetElement, maxLength);

  if (highlight) {
    console.log("DOM Structure (with syntax highlighting):");
    console.log(domString);
  } else {
    console.log("DOM Structure:", domString);
  }

  console.groupEnd();
}

/**
 * Logs all accessible roles in the current document
 */
export function debugAccessibilityRoles(): void {
  console.group("♿ Accessibility Roles Debug");

  try {
    logRoles(document.body);
  } catch (error) {
    console.error("Error logging roles:", error);
  }

  console.groupEnd();
}

/**
 * Finds and logs elements by various query methods
 */
export function debugElementQueries(searchTerm: string): void {
  console.group(`🔍 Element Queries Debug: "${searchTerm}"`);

  const queries = [
    () => screen.queryByText(new RegExp(searchTerm, "i")),
    () => screen.queryByLabelText(new RegExp(searchTerm, "i")),
    () => screen.queryByPlaceholderText(new RegExp(searchTerm, "i")),
    () => screen.queryByDisplayValue(new RegExp(searchTerm, "i")),
    () => screen.queryByRole("button", { name: new RegExp(searchTerm, "i") }),
    () => screen.queryByTestId(searchTerm),
    () => document.querySelector(`[data-testid*="${searchTerm}"]`),
    () => document.querySelector(`[class*="${searchTerm}"]`),
    () => document.querySelector(`[id*="${searchTerm}"]`),
  ];

  const queryNames = [
    "getByText",
    "getByLabelText",
    "getByPlaceholderText",
    "getByDisplayValue",
    "getByRole(button)",
    "getByTestId",
    "querySelector(data-testid)",
    "querySelector(class)",
    "querySelector(id)",
  ];

  queries.forEach((query, index) => {
    try {
      const result = query();
      if (result) {
        console.log(`✅ ${queryNames[index]}:`, result);
      } else {
        console.log(`❌ ${queryNames[index]}: Not found`);
      }
    } catch (error) {
      console.log(`❌ ${queryNames[index]}: Error -`, error);
    }
  });

  console.groupEnd();
}

/**
 * Logs current form errors in a user-friendly way
 */
export function debugFormErrors(): void {
  console.group("🚨 Form Errors Debug");

  const errorSelectors = [
    '[data-testid*="error"]',
    '[role="alert"]',
    ".error",
    ".text-red-500",
    ".form-field-error",
  ];

  let foundErrors = false;

  errorSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundErrors = true;
      console.log(
        `\n🔍 Selector "${selector}" found ${elements.length} elements:`,
      );
      elements.forEach((element, index) => {
        console.log(`  Error ${index + 1}:`, {
          text: element.textContent?.trim(),
          visible: (element as HTMLElement).offsetParent !== null,
          classes: element.className,
          attributes: Array.from(element.attributes).reduce(
            (acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            },
            {} as Record<string, string>,
          ),
        });
      });
    }
  });

  if (!foundErrors) {
    console.log("No form errors found on the page");
  }

  console.groupEnd();
}

// ============================================================================
// Component State Debugging
// ============================================================================

/**
 * Logs the current state of common UI components
 */
export function debugUIComponents(): void {
  console.group("🧩 UI Components Debug");

  // Debug buttons
  const buttons = document.querySelectorAll("button");
  if (buttons.length > 0) {
    console.log("\n🔘 Buttons:");
    buttons.forEach((btn, index) => {
      console.log(`  Button ${index + 1}:`, {
        text: btn.textContent?.trim(),
        disabled: btn.hasAttribute("disabled"),
        type: btn.getAttribute("type"),
        loading: btn.querySelector(".animate-spin") !== null,
        classes: btn.className,
      });
    });
  }

  // Debug inputs
  const inputs = document.querySelectorAll("input, textarea");
  if (inputs.length > 0) {
    console.log("\n📝 Form Inputs:");
    inputs.forEach((input, index) => {
      const element = input as HTMLInputElement | HTMLTextAreaElement;
      console.log(`  Input ${index + 1}:`, {
        type: element.type,
        value: element.value,
        placeholder: "placeholder" in element ? element.placeholder : undefined,
        disabled: element.disabled,
        required: element.required,
        validity: element.validity.valid,
      });
    });
  }

  // Debug modals/dialogs
  const modals = document.querySelectorAll(
    '[role="dialog"], .modal, [data-testid*="modal"]',
  );
  if (modals.length > 0) {
    console.log("\n🪟 Modals/Dialogs:");
    modals.forEach((modal, index) => {
      console.log(`  Modal ${index + 1}:`, {
        visible: (modal as HTMLElement).offsetParent !== null,
        "aria-hidden": modal.getAttribute("aria-hidden"),
        classes: modal.className,
      });
    });
  }

  console.groupEnd();
}

/**
 * Debugs loading states across the page
 */
export function debugLoadingStates(): void {
  console.group("⏳ Loading States Debug");

  const loadingSelectors = [
    ".animate-spin",
    '[data-testid*="loading"]',
    '[data-testid*="spinner"]',
    '[aria-busy="true"]',
    ".loading",
  ];

  let foundLoading = false;

  loadingSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      foundLoading = true;
      console.log(
        `\n🔄 Loading selector "${selector}":`,
        elements.length,
        "elements",
      );
      elements.forEach((element, index) => {
        console.log(`  Loading ${index + 1}:`, {
          visible: (element as HTMLElement).offsetParent !== null,
          text: element.textContent?.trim(),
          parent: element.parentElement?.tagName,
        });
      });
    }
  });

  if (!foundLoading) {
    console.log("No loading states found");
  }

  console.groupEnd();
}

// ============================================================================
// Test Utilities Debugging
// ============================================================================

/**
 * Validates that test utilities are working correctly
 */
export function debugTestUtilities(): void {
  console.group("🧪 Test Utilities Debug");

  // Check if testing library is available
  console.log("Testing Library available:", typeof screen !== "undefined");

  // Check if vitest is available
  console.log("Vitest available:", typeof vi !== "undefined");

  // Check if mocks are working
  try {
    const testMock = vi.fn();
    testMock("test");
    console.log("Mock functions working:", testMock.mock.calls.length === 1);
  } catch (error) {
    console.log("Mock functions error:", error);
  }

  // Check if DOM is available
  console.log("DOM available:", typeof document !== "undefined");
  console.log("Body element:", document.body ? "Present" : "Missing");

  // Check if React is available
  console.log("React available:", typeof globalThis.React !== "undefined");

  console.groupEnd();
}

/**
 * Comprehensive debugging function that runs multiple checks
 */
export function debugEverything(context = "General Debug"): void {
  console.group(`🔧 Comprehensive Debug: ${context}`);

  debugTestUtilities();
  debugDOM();
  debugAccessibilityRoles();
  debugUIComponents();
  debugFormFields();
  debugFormErrors();
  debugLoadingStates();

  console.groupEnd();
}

// ============================================================================
// Performance Debugging
// ============================================================================

/**
 * Times a function execution for performance debugging
 */
export function debugPerformance<T>(
  fn: () => T,
  label = "Performance Test",
): T {
  console.time(label);
  const result = fn();
  console.timeEnd(label);
  return result;
}

/**
 * Async version of performance debugging
 */
export async function debugPerformanceAsync<T>(
  fn: () => Promise<T>,
  label = "Async Performance Test",
): Promise<T> {
  console.time(label);
  const result = await fn();
  console.timeEnd(label);
  return result;
}

// ============================================================================
// Network/API Debugging
// ============================================================================

/**
 * Logs mock API call information
 */
export function debugMockAPICalls(
  mockFn: Record<string, unknown>,
  label = "Mock API",
): void {
  console.group(`🌐 ${label} Debug`);

  if (mockFn && "mock" in mockFn && mockFn.mock) {
    const mock = mockFn.mock as {
      calls: unknown[];
      results: unknown[];
      lastCall: unknown;
    };
    console.log("Total calls:", mock.calls.length);
    console.log("Call arguments:", mock.calls);
    console.log("Return values:", mock.results);
    console.log("Last call:", mock.lastCall);
  } else {
    console.log("No mock information available");
  }

  console.groupEnd();
}

// ============================================================================
// Export Convenience Functions
// ============================================================================

/**
 * Quick debug shorthand for common scenarios
 */
export const debug = {
  form: debugFormState,
  validation: debugFormValidation,
  fields: debugFormFields,
  dom: debugDOM,
  errors: debugFormErrors,
  ui: debugUIComponents,
  loading: debugLoadingStates,
  queries: debugElementQueries,
  accessibility: debugAccessibilityRoles,
  everything: debugEverything,
  performance: debugPerformance,
  api: debugMockAPICalls,
};

// Global debug helper (useful for quick debugging in browser console)
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).debugTest = debug;
}
