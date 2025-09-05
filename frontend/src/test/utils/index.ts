/**
 * Central Export Hub for Test Utilities
 *
 * This file provides a single import point for all our enhanced test utilities,
 * fixtures, and helpers that have contributed to our 99.6% pass rate.
 */

// Core testing utilities
export { renderWithProviders } from "./testUtils";
export { AllTheProviders, createTestQueryClient } from "./TestProviders";

// Data fixtures and builders
export * from "./fixtures";

// Setup and teardown utilities
export {
  setupTestEnvironment,
  setupReactQuery,
  MockManager,
  setupMockManager,
  createFormTestMocks,
  setupFormTests,
  setupComponentTests,
  setupStandardTest,
  setupFormTest,
  setupFullTest,
} from "./setupUtils";

// Form testing helpers
export {
  simulateUserInput,
  renderWithFormProvider,
  waitForFormUpdate,
  createTestFormHook,
  formAssert,
  createFormData,
  simulateFormWorkflow,
  waitForFormStep,
  formTestPatterns,
} from "./formTestHelpers";

// Mock components and utilities
export * from "./mockComponents";
export * from "./mockData";
export * from "./mockHooks";

// Debugging helpers
export * from "./debugHelpers";

// Convenience re-exports from testing libraries
export { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
export { renderHook, act } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Common patterns for quick access
export const testUtils = {
  // Quick setup functions
  setupStandardTest: () =>
    import("./setupUtils").then((m) => m.setupStandardTest()),
  setupFormTest: () => import("./setupUtils").then((m) => m.setupFormTest()),
  setupFullTest: () => import("./setupUtils").then((m) => m.setupFullTest()),

  // Quick fixture access
  fixtures: () => import("./fixtures"),

  // Quick debug access
  debug: () => import("./debugHelpers").then((m) => m.debug),

  // Quick mock access
  mocks: () => import("./mockComponents"),
};
