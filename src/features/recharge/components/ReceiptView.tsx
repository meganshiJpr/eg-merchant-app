"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRecharge, type ReceiptStatus } from "../store";
import { inr } from "../data";
import { useToast } from "@/components/ui/Toast";

const STATUS: Record<
  ReceiptStatus,
  { title: string; sub: string; note: string; fg: string; bg: string; icon: React.ReactNode }
> = {
  success: {
    title: "Recharge Successful",
    sub: "Benefits are active on the number now",
    note: "Amount debited from wallet. Commission will reflect in your reports shortly.",
    fg: "var(--teal)",
    bg: "var(--teal-soft)",
    icon: (
      <path d="M6 12.5 10.2 16.7 18 8.5" stroke="var(--teal)" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  processing: {
    title: "Recharge Processing",
    sub: "Operator is confirming this recharge",
    note: "Status updates automatically within 10 minutes. Amount is held from wallet and auto-refunded if the recharge fails.",
    fg: "var(--orange)",
    bg: "var(--orange-soft)",
    icon: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4 11h-5V6h2v5h3Z" fill="var(--orange)" />,
  },
  failed: {
    title: "Recharge Failed",
    sub: "The operator rejected this recharge",
    note: "No amount deducted. If any hold was placed, it is reversed to your wallet immediately.",
    fg: "var(--accent)",
    bg: "var(--accent-soft)",
    icon: (
      <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3Z" fill="var(--accent)" />
    ),
  },
  refunded: {
    title: "Amount Refunded",
    sub: "Recharge could not complete · money returned",
    note: "Full amount has been refunded to your wallet. You can retry the recharge anytime.",
    fg: "var(--violet)",
    bg: "var(--violet-soft)",
    icon: <path d="M12 5V1L6 7l6 6V9a6 6 0 1 1-6 6H3.5A8.5 8.5 0 1 0 12 5Z" fill="var(--violet)" />,
  },
};

export function ReceiptView() {
  const router = useRouter();
  const flow = useRecharge();
  const toast = useToast((t) => t.show);
  const r = flow.receipt;

  useEffect(() => {
    if (!r) router.replace("/recharge");
  }, [r, router]);
  if (!r) return null;

  const st = STATUS[r.status];
  const wordFix = (s: string) =>
    r.mode === "bill" ? s.replace(/Recharge/g, "Payment").replace(/recharge/g, "payment") : s;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="pt-4 text-center">
        <span
          className="mx-auto flex h-[74px] w-[74px] items-center justify-center rounded-full"
          style={{ background: st.bg }}
        >
          <svg viewBox="0 0 24 24" className="h-9 w-9">
            {st.icon}
          </svg>
        </span>
        <div className="mt-3 font-display text-[19px] font-bold" style={{ color: st.fg }}>
          {wordFix(st.title)}
        </div>
        <div className="mt-1 text-[12px] text-text-2">{wordFix(st.sub)}</div>
        <div className="mono mt-3 text-[34px] font-semibold">Rs {inr(r.amount)}</div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-4 py-1">
        {r.rows.map((row) => (
          <div
            key={row.k}
            className="flex justify-between gap-4 border-b border-border py-2.5 text-[12.5px] last:border-0"
          >
            <span className="flex-none text-text-3">{row.k}</span>
            <span className={`text-right font-semibold ${row.mono ? "mono font-medium" : ""}`}>
              {row.v}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex gap-2 rounded-xl px-3.5 py-3 text-[11.5px] font-medium leading-relaxed"
        style={{ background: st.bg, color: st.fg }}
      >
        <svg viewBox="0 0 24 24" className="mt-0.5 h-[15px] w-[15px] flex-none" style={{ fill: st.fg }}>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2Zm0-8h-2V7h2Z" />
        </svg>
        {wordFix(st.note)}
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={() => toast("Opens share sheet with receipt image")}
          className="flex-1 rounded-xl border-[1.5px] border-border bg-surface py-3 font-display text-[13px] font-semibold"
        >
          Share Receipt
        </button>
        {r.retryHref && (
          <Link
            href={r.retryHref}
            className="flex-1 rounded-xl border-[1.5px] border-border bg-surface py-3 text-center font-display text-[13px] font-semibold"
          >
            Try Again
          </Link>
        )}
        <Link
          href="/"
          onClick={() => flow.reset()}
          className="flex-1 rounded-xl bg-primary py-3 text-center font-display text-[13px] font-semibold text-white"
        >
          Done
        </Link>
      </div>
    </div>
  );
}
