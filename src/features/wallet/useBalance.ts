"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "./api";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Live wallet balance from the backend. Enabled only once logged in.
 * Errors are surfaced globally (see providers.tsx → QueryCache.onError),
 * so this hook stays free of any error/toast code.
 */
export function useBalance() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["balance"],
    queryFn: fetchBalance,
    enabled: !!token,
    staleTime: 15_000,
    refetchOnMount: "always",
  });
}
