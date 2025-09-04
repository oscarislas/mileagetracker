import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock ResizeObserver for tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia for mobile tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock axios completely to prevent real HTTP requests
vi.mock("axios", async () => {
  const actual = await vi.importActual("axios");
  return {
    ...actual,
    default: {
      create: () => ({
        get: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
        post: vi.fn(() => Promise.resolve({ data: {}, status: 201 })),
        put: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
        delete: vi.fn(() => Promise.resolve({ data: {}, status: 200 })),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      }),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
        response: { use: vi.fn(), eject: vi.fn() },
      },
    },
  };
});

// Mock window.confirm for deletion tests
Object.defineProperty(window, "confirm", {
  writable: true,
  value: vi.fn(() => true),
});
