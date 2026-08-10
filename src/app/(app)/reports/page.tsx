"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const GROUPS = [
  {
    title: "Transactions",
    rows: [
      { label: "Transactions", sub: "All recharges and bill payments", href: "/reports/transactions", c: "var(--primary)", s: "var(--primary-soft)" },
      { label: "Disputes & Complaints", sub: "Raised complaints and their status", href: "/reports/disputes", c: "var(--orange)", s: "var(--orange-soft)" },
      { label: "AEPS Reports", sub: "Withdrawals, deposits, mini statements", c: "var(--teal)", s: "var(--teal-soft)" },
      { label: "Money Transfer Reports", sub: "DMT transaction history", c: "var(--violet)", s: "var(--violet-soft)" },
    ],
  },
  {
    title: "Account",
    rows: [
      { label: "Wallet Ledger", sub: "Every credit and debit in your wallet", href: "/reports/ledger", c: "var(--primary)", s: "var(--primary-soft)" },
      { label: "Commission Report", sub: "Earnings by service and by day", href: "/reports/commission", c: "var(--teal)", s: "var(--teal-soft)" },
      { label: "Deposit Reports", sub: "Online wallet top-ups via UPI", href: "/reports/deposits", c: "var(--teal)", s: "var(--teal-soft)" },
      { label: "Manual Deposit Requests", sub: "Status of your deposit requests", href: "/reports/manual-deposits", c: "var(--orange)", s: "var(--orange-soft)" },
      { label: "Refund Report", sub: "Failed transaction refunds", c: "var(--violet)", s: "var(--violet-soft)" },
    ],
  },
];

export default function ReportsPage() {
  const router = useRouter();
  const toast = useToast((t) => t.show);
  return (
    <div className="flex flex-col gap-4 p-4">
      {GROUPS.map((g) => (
        <section key={g.title} className="rounded-2xl border border-border bg-surface p-2">
          <div className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-text-3">{g.title}</div>
          {g.rows.map((r) => (
            <button
              key={r.label}
              onClick={() => (r.href ? router.push(r.href) : toast(`${r.label} — coming next`))}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-page"
            >
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: r.s }}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ fill: r.c }}>
                  <rect x="6.5" y="1.5" width="11" height="21" rx="2.8" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{r.label}</span>
                <span className="block text-[11px] text-text-3">{r.sub}</span>
              </span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none fill-text-3">
                <path d="M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3Z" />
              </svg>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
