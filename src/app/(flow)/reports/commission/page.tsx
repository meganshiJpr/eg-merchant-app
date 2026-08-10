"use client";

import { useMemo, useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { COMMS, SVC_COLOR, SVC_SOFT, inr } from "@/features/reports/data";

const RANGES = [
  { label: "Today", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "All", days: 0 },
  { label: "Custom", days: -1 },
];

function parseDMY(v: string): number | null {
  if (v.length !== 10) return null;
  const dd = +v.slice(0, 2), mm = +v.slice(3, 5), yy = +v.slice(6);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
  return new Date(yy, mm - 1, dd).getTime();
}
function fmtDMY(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export default function CommissionPage() {
  const [rangeI, setRangeI] = useState(2);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { groups, totalAmt, totalComm } = useMemo(() => {
    const days = RANGES[rangeI].days;
    let lo = 0, hi = Infinity;
    if (days > 0) lo = Date.now() - days * 86400000;
    if (days === -1) {
      const f = parseDMY(from), t = parseDMY(to);
      if (f) lo = f;
      if (t) hi = t + 86400000 - 1;
    }
    const g: Record<string, { n: number; amt: number; comm: number }> = {};
    const order: string[] = [];
    let tA = 0, tC = 0;
    for (const x of COMMS) {
      if (x.t < lo || x.t > hi) continue;
      if (!g[x.svc]) { g[x.svc] = { n: 0, amt: 0, comm: 0 }; order.push(x.svc); }
      g[x.svc].n++; g[x.svc].amt += x.amt; g[x.svc].comm += x.comm;
      tA += x.amt; tC += x.comm;
    }
    return { groups: order.map((s) => ({ svc: s, ...g[s] })), totalAmt: tA, totalComm: tC };
  }, [rangeI, from, to]);

  return (
    <>
      <SubHeader title="Commission Report" backHref="/reports" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeI(i)}
              className={`flex-none rounded-full border-[1.5px] px-3.5 py-1.5 text-[11.5px] font-semibold ${i === rangeI ? "border-primary bg-primary-soft text-primary" : "border-border bg-page text-text-2"}`}>
              {r.label}
            </button>
          ))}
        </div>
        {RANGES[rangeI].days === -1 && (
          <div className="flex gap-2">
            <input value={from} onChange={(e) => setFrom(fmtDMY(e.target.value))} inputMode="numeric" maxLength={10} placeholder="From DD/MM/YYYY" className="mono flex-1 rounded-xl border-[1.5px] border-border bg-surface px-3 py-2.5 text-[13px] outline-none focus:border-primary" />
            <input value={to} onChange={(e) => setTo(fmtDMY(e.target.value))} inputMode="numeric" maxLength={10} placeholder="To DD/MM/YYYY" className="mono flex-1 rounded-xl border-[1.5px] border-border bg-surface px-3 py-2.5 text-[13px] outline-none focus:border-primary" />
          </div>
        )}
        <div className="flex gap-2.5">
          <div className="flex-1 rounded-2xl border border-border bg-surface p-3.5">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-text-3">Total Txn Amount</div>
            <div className="mono mt-1 text-[18px] font-semibold">Rs {inr(totalAmt)}</div>
          </div>
          <div className="flex-1 rounded-2xl border border-border bg-surface p-3.5">
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-text-3">Total Commission</div>
            <div className="mono mt-1 text-[18px] font-semibold text-teal">Rs {inr(totalComm)}</div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {groups.map((g) => (
            <div key={g.svc} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl" style={{ background: SVC_SOFT[g.svc] ?? "var(--primary-soft)" }}>
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" style={{ fill: SVC_COLOR[g.svc] ?? "var(--primary)" }}><rect x="6.5" y="1.5" width="11" height="21" rx="2.8" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold">{g.svc}</div>
                <div className="mono mt-0.5 text-[10.5px] text-text-3">{g.n} txn{g.n > 1 ? "s" : ""} · Rs {inr(g.amt)} total</div>
              </div>
              <div className="flex-none text-right">
                <div className="mono text-[13.5px] font-semibold text-teal">+ Rs {inr(g.comm)}</div>
                <div className="text-[10px] text-text-3">commission</div>
              </div>
            </div>
          ))}
          {!groups.length && <div className="py-6 text-center text-[12.5px] text-text-3">No transactions in this period</div>}
        </div>
      </div>
    </>
  );
}
