"use client";

import { useMemo, useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DateChips } from "@/components/ui/DateChips";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { DISPUTES, SVC_COLOR, SVC_SOFT, withinDays } from "@/features/reports/data";
import { fmtDate, inr } from "@/utils/format";

const DAYS = [1, 7, 30, 0];
const LABEL = { open: "Open", progress: "In Progress", resolved: "Resolved", rejected: "Rejected" };
const ST_MAP = { "all status": "all", open: "open", "in progress": "progress", resolved: "resolved", rejected: "rejected" };

export default function DisputesPage() {
  const [dateI, setDateI] = useState(2);
  const [status, setStatus] = useState("All status");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const needle = q.replace(/\s/g, "").toLowerCase();
    const st = ST_MAP[status.toLowerCase()];
    return DISPUTES.filter((x) => withinDays(x.t, DAYS[dateI]) &&
      (st === "all" || x.st === st) &&
      (!needle || x.cid.toLowerCase().includes(needle) || x.txn.toLowerCase().includes(needle) || x.acct.replace(/\s/g, "").toLowerCase().includes(needle)));
  }, [dateI, status, q]);

  return (
    <>
      <SubHeader title="Disputes & Complaints" backHref="/reports" />
      <div className="flex flex-col gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search complaint ID, order ID or number" />
        <DateChips active={dateI} onChange={setDateI} />
        <Select value={status} onChange={setStatus} options={["All status", "Open", "In Progress", "Resolved", "Rejected"]} />
        <div className="flex flex-col gap-2">
          {rows.map((x) => (
            <div key={x.cid} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-3 py-3">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl" style={{ background: SVC_SOFT[x.svc] ?? "var(--primary-soft)" }}>
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" style={{ fill: SVC_COLOR[x.svc] ?? "var(--primary)" }}><path d="M12 2 1.5 20.5h21Zm1.1 13.6h-2.2v-5h2.2Zm0 3.4h-2.2v-2.2h2.2Z" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold">{x.svc} · {x.op} · {x.acct}</div>
                <div className="mono mt-0.5 text-[10.5px] text-text-3">{x.cid} · Txn {x.txn}</div>
                <div className="mono text-[10.5px] text-text-3">{fmtDate(x.t)}</div>
                <div className="mt-1 text-[11px] leading-snug text-text-2">{x.remark}</div>
                {x.res && <div className="mt-0.5 text-[11px] font-semibold leading-snug" style={{ color: x.st === "rejected" ? "var(--accent)" : "var(--teal)" }}>{x.res}</div>}
              </div>
              <div className="flex-none text-right">
                <div className="mono text-[13px] font-semibold">Rs {inr(x.amt)}</div>
                <Pill tone={x.st}>{LABEL[x.st]}</Pill>
              </div>
            </div>
          ))}
          {!rows.length && <div className="py-6 text-center text-[12.5px] text-text-3">No complaints for these filters</div>}
        </div>
      </div>
    </>
  );
}
