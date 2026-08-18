"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "../api";
import { useAuthStore } from "@/lib/auth/store";

export function useDashboard() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
    enabled: !!token,
    staleTime: 30_000,
    refetchOnMount: "stale",
  });
}


