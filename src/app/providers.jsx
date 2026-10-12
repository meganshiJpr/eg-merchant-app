"use client";

import "@/lib/i18n";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ToastHost } from "@/components/ui/Toast";
import { useTheme } from "@/lib/store/theme";
import { retryPolicy, showQueryError } from "@/lib/net/queryErrors";
import { UIHistoryProvider } from "@/lib/history/UIHistoryContext";
import { SessionExpiredOverlay } from "@/components/auth/SessionExpiredOverlay";
import { useSessionExpiryStore } from "@/lib/auth/sessionExpiryStore";

export function Providers({ children }) {
  const applyTheme = useTheme((t) => t.apply);
  const sessionExpired = useSessionExpiryStore((state) => state.expired);
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
      <UIHistoryProvider>
        <div inert={sessionExpired} aria-hidden={sessionExpired || undefined}>
          {children}
          <ToastHost />
        </div>
        <SessionExpiredOverlay />
      </UIHistoryProvider>
    </QueryClientProvider>
  );
}
