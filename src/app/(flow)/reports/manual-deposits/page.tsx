"use client";

import { useMemo, useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DateChips } from "@/components/ui/DateChips";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { MANUAL_DEPS, fmtDate, withinDays, inr } from "@/features/reports/data";

const DAYS = [1, 7, 30, 0];
const LABEL: Record<string, string> = { approved: "Approved", pending: "Pending", rejected: "Rejected" };

export default function ManualDepositsPage() {
  const [dateI, setDateI] = useState(2);
  const [status, setStatus] = useState("All status");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.replace(/\s/g, "").toLowerCase();
    return MANUAL_DEPS.filter((x) => withinDays(x.t, DAYS[dateI]) &&
      (status === "All status" || x.st === status.toLowerCase()) &&
      (!needle || x.id.toLowerCase().includes(needle) || x.utr.toLowerCase().includes(needle)));
  }, [dateI, status, q]);

  return (
    <>
      <SubHeader title="Manual Deposit Requests" backHref="/reports" />
      <div className="flex flex-col gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search request ID or UTR" />
        <DateChips active={dateI} onChange={setDateI} />
        <Select value={status} onChange={setStatus} options={["All status", "Approved", "Pending", "Rejected"]} />
        <div className="flex flex-col gap-2">
          {rows.map((x) => (
            <div key={x.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-primary-soft">
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] fill-primary"><path d="M12 2 3 7v2h18V7Zm-7 9h3v7H5Zm5.5 0h3v7h-3ZM16 11h3v7h-3ZM3 20h18v2H3Z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold">{x.mode} · {x.bank}</div>
                <div className="mono mt-0.5 text-[10.5px] text-text-3">{x.id} · UTR {x.utr}</div>
                <div className="mono text-[10.5px] text-text-3">{fmtDate(x.t)}</div>
                {x.st === "rejected" && x.reason && <div className="mt-1 text-[10.5px] font-semibold leading-snug text-accent">{x.reason}</div>}
              </div>
              <div className="flex-none text-right">
                <div className="mono text-[13px] font-semibold">Rs {inr(x.amt)}</div>
                <Pill tone={x.st}>{LABEL[x.st]}</Pill>
              </div>
            </div>
          ))}
          {!rows.length && <div className="py-6 text-center text-[12.5px] text-text-3">No deposit requests for these filters</div>}
        </div>
      </div>
    </>
  );
}
