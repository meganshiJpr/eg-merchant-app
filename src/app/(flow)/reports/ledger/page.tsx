"use client";

import { useMemo, useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DateChips } from "@/components/ui/DateChips";
import { LEDGER, fmtDate, withinDays, inr } from "@/features/reports/data";

const DAYS = [1, 7, 30, 0];

export default function LedgerPage() {
  const [dateI, setDateI] = useState(2);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.replace(/\s/g, "").toLowerCase();
    return LEDGER.filter((x) => withinDays(x.t, DAYS[dateI]) &&
      (!needle || x.id.toLowerCase().includes(needle) || x.remark.replace(/\s/g, "").toLowerCase().includes(needle)));
  }, [dateI, q]);

  return (
    <>
      <SubHeader title="Wallet Ledger" backHref="/reports" />
      <div className="flex flex-col gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search order ID or number" />
        <DateChips active={dateI} onChange={setDateI} />
        <div className="flex flex-col gap-2">
          {rows.map((x) => {
            const cr = x.ty === "cr";
            return (
              <div key={x.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3">
                <span className="mt-0.5 flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full" style={{ background: cr ? "var(--teal-soft)" : "var(--accent-soft)" }}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path d={cr ? "M12 20V7M6.5 12.5 12 7l5.5 5.5" : "M12 4v13M6.5 11.5 12 17l5.5-5.5"} stroke={cr ? "var(--teal)" : "var(--accent)"} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold">{x.remark}</div>
                  <div className="mono mt-0.5 text-[10.5px] text-text-3">{x.id} · {fmtDate(x.t)}</div>
                </div>
                <div className="flex-none text-right">
                  <div className={`mono text-[13.5px] font-semibold ${cr ? "text-teal" : "text-accent"}`}>{cr ? "+" : "−"} Rs {inr(x.amt)}</div>
                  <div className="mono mt-1 text-[10px] text-text-3">Bal Rs {inr(x.bal)}</div>
                </div>
              </div>
            );
          })}
          {!rows.length && <div className="py-6 text-center text-[12.5px] text-text-3">No ledger entries for these filters</div>}
        </div>
      </div>
    </>
  );
}
