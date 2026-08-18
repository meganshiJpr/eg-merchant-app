"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth/store";
import { useBalance } from "@/features/wallet/hooks/useBalance";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] ?? "") + (p[1]?.[0] ?? "");
}

export function Header() {
  const merchant = useAuthStore((s) => s.merchant);
  // const name = merchant?.name || "Merchant";
  const shop = merchant?.shopName || "Your Shop";
  const { data, isLoading, isError } = useBalance();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard();

  const name = dashboardData?.name || shop;

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary-soft font-display text-[13px] font-bold uppercase text-primary">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-text-3">{greeting()}</div>
          <div className="truncate text-[13.5px] font-semibold">
            {dashboardLoading ? "Loading..." : name}
          </div>
        </div>
      </Link>

      <Link
        href="/wallet"
        className="mono flex flex-none items-center gap-1.5 rounded-full border border-border bg-page px-3 py-1.5 text-[12.5px] font-semibold"
      >
        <span className="text-text-3">Rs</span>
        {isLoading ? (
          <span className="inline-block h-3 w-8 animate-pulse rounded bg-border" />
        ) : isError ? (
          <span className="text-text-3">--</span>
        ) : (
          (data?.earnings ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        )}
      </Link>

      <Link
        href="/support"
        aria-label="Help and support"
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary-soft"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-primary">
          <path d="M12 2a8 8 0 0 0-8 8v6.5A2.5 2.5 0 0 0 6.5 19H8v-6H5.9v-3a6.1 6.1 0 0 1 12.2 0v3H16v6h1.5a2.5 2.5 0 0 0 2.5-2.5V10a8 8 0 0 0-8-8Z" />
        </svg>
      </Link>
    </header>
  );
}
