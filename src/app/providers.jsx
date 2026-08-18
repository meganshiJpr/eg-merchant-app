"use client";

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ToastHost } from "@/components/ui/Toast";
import { useTheme } from "@/lib/store/theme";
import { retryPolicy, showQueryError } from "@/lib/net/queryErrors";

export function Providers({ children }) {
  const applyTheme = useTheme((t) => t.apply);
  useEffect(() => { applyTheme(); }, [applyTheme]);

  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: (error) => showQueryError(error) }),
        mutationCache: new MutationCache({ onError: (error) => showQueryError(error) }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: retryPolicy,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <ToastHost />
    </QueryClientProvider>
  );
}
