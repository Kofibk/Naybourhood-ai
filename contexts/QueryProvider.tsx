"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh, mutations update cache directly
            gcTime: 30 * 60 * 1000, // 30 minutes - keep unused data in cache (matches old DataContext)
            refetchOnWindowFocus: false,
            retry: 3,
            retryDelay: (attempt) => Math.min(attempt * 1000, 5000),
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
