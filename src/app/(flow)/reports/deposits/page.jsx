"use client";

import { useMemo, useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DateChips } from "@/components/ui/DateChips";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { DEPOSITS, withinDays } from "@/features/reports/data";
import { fmtDate, inr } from "@/utils/format";

const DAYS = [1, 7, 30, 0];
const LABEL = { success: "Success", pending: "Pending", failed: "Failed" };

export default function DepositsPage() {
  const [dateI, setDateI] = useState(2);
  const [status, setStatus] = useState("All status");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.replace(/\s/g, "").toLowerCase();
    return DEPOSITS.filter((x) => withinDays(x.t, DAYS[dateI]) &&
      (status === "All status" || x.st === status.toLowerCase()) &&
      (!needle || x.id.toLowerCase().includes(needle) || x.rrn.includes(needle)));
  }, [dateI, status, q]);

  return (
    <>
      <SubHeader title="Deposit Reports" backHref="/reports" />
      <div className="flex flex-col gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search order ID or RRN" />
        <DateChips active={dateI} onChange={setDateI} />
        <Select value={status} onChange={setStatus} options={["All status", "Success", "Pending", "Failed"]} />
        <div className="flex flex-col gap-2">
          {rows.map((x) => (
            <div key={x.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-teal-soft">
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]"><path d="M12 21 12 11 M8.5 14.5 12 11 15.5 14.5" stroke="var(--teal)" strokeWidth="2.2" fill="none" strokeLinecap="round" /><rect x="3" y="3" width="18" height="7" rx="2" fill="var(--teal)" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold">Wallet top-up · {x.app}</div>
                <div className="mono mt-0.5 text-[10.5px] text-text-3">{x.id} · RRN {x.rrn}</div>
                <div className="mono text-[10.5px] text-text-3">{fmtDate(x.t)}</div>
              </div>
              <div className="flex-none text-right">
                <div className="mono text-[13px] font-semibold">Rs {inr(x.amt)}</div>
                <Pill tone={x.st}>{LABEL[x.st]}</Pill>
              </div>
            </div>
          ))}
          {!rows.length && <div className="py-6 text-center text-[12.5px] text-text-3">No deposits found for these filters</div>}
        </div>
      </div>
    </>
  );
}
