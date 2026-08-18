"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DateChips } from "@/components/ui/DateChips";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { TXNS, SVC_COLOR, SVC_SOFT, withinDays } from "@/features/reports/data";
import { useRecharge } from "@/features/recharge/store";
import { fmtDate, inr } from "@/utils/format";

const PILL_LABEL = { success: "Success", processing: "Processing", failed: "Failed", refunded: "Refunded" };
const DAYS = [1, 7, 30, 0];

export default function TransactionsPage() {
  const router = useRouter();
  const setReceipt = useRecharge((s) => s.set);
  const [dateI, setDateI] = useState(2);
  const [svc, setSvc] = useState("All services");
  const [status, setStatus] = useState("All status");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.replace(/\s/g, "").toLowerCase();
    return TXNS.filter((x) => {
      if (!withinDays(x.t, DAYS[dateI])) return false;
      if (svc !== "All services" && x.svc !== svc) return false;
      if (status !== "All status" && x.st !== status.toLowerCase()) return false;
      if (needle && !x.id.toLowerCase().includes(needle) && !x.acct.replace(/\s/g, "").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [dateI, svc, status, q]);

  function openReceipt(x) {
    const isBill = ["Electricity", "Water", "Gas"].includes(x.svc);
    setReceipt({
      receipt: {
        status: x.st,
        amount: x.amt,
        paidVia: "Wallet",
        mode: isBill ? "bill" : "plan",
        retryHref: null,
        rows: [
          { k: "Service", v: x.svc },
          { k: "Operator", v: x.op },
          { k: "Account", v: x.acct, mono: true },
          { k: "Paid via", v: "Wallet" },
          { k: "Date & time", v: fmtDate(x.t) },
          { k: "Order ID", v: x.id, mono: true },
        ],
      },
    });
    router.push("/recharge/receipt");
  }

  return (
    <>
      <SubHeader title="Transactions" backHref="/reports" />
      <div className="flex flex-col gap-3 p-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search order ID or number" />
        <DateChips active={dateI} onChange={setDateI} />
        <div className="flex gap-2">
          <Select value={svc} onChange={setSvc} className="flex-1" options={["All services", "Mobile", "DTH", "Electricity", "Water", "Gas", "FASTag"]} />
          <Select value={status} onChange={setStatus} className="flex-1" options={["All status", "Success", "Processing", "Failed", "Refunded"]} />
        </div>
        <div className="flex flex-col gap-2">
          {rows.map((x) => (
            <button key={x.id} onClick={() => openReceipt(x)} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left active:scale-[0.988]">
              <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl" style={{ background: SVC_SOFT[x.svc] }}>
                <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" style={{ fill: SVC_COLOR[x.svc] }}>
                  <rect x="6.5" y="1.5" width="11" height="21" rx="2.8" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold">{x.op} · {x.acct}</span>
                <span className="mono block text-[10.5px] text-text-3">{x.id} · {fmtDate(x.t)}</span>
              </span>
              <span className="flex-none text-right">
                <span className="mono block text-[13px] font-semibold">Rs {inr(x.amt)}</span>
                <Pill tone={x.st}>{PILL_LABEL[x.st]}</Pill>
              </span>
            </button>
          ))}
          {!rows.length && <div className="py-6 text-center text-[12.5px] text-text-3">No transactions found for these filters</div>}
        </div>
      </div>
    </>
  );
}
