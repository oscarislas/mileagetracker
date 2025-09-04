import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a test query client with no retries for faster tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Wrapper component for tests that need React Query
export function AllTheProviders({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Also export the query client creator for direct use in tests
// eslint-disable-next-line react-refresh/only-export-components
export { createTestQueryClient };
