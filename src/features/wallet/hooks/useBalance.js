"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "../api";
import { useAuthStore } from "@/lib/auth/store";

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
