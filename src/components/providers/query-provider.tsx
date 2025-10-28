"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a singleton QueryClient to persist across navigation
let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 5 minutes (won't refetch during this time)
        staleTime: 5 * 60 * 1000,
        // Cache stays in memory for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests
        retry: 1,
        // Don't refetch on window focus - this was causing refetches!
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect
        refetchOnReconnect: false,
        // Don't refetch on mount if data is fresh
        refetchOnMount: false,
      },
      mutations: {
        // Retry failed mutations once
        retry: 1,
      },
    },
  });
}

function getQueryClient() {
  // Server: always make a new query client
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may suspend
  // because React will throw away the client on the initial render if it
  // suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
