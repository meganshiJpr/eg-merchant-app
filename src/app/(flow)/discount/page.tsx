"use client";

import { SubHeader } from "@/components/ui/SubHeader";

const GROUPS = [
  { group: "Prepaid Recharge", hint: "percentage of recharge amount", items: [
    { n: "Jio", a: "Jio", c: "#0A2885", m: "2.5%" }, { n: "Airtel", a: "Ai", c: "#E40000", m: "2.0%" },
    { n: "Vi", a: "Vi", c: "#EE2E7B", m: "2.8%" }, { n: "BSNL", a: "BS", c: "#008540", m: "3.5%" },
  ]},
  { group: "DTH Recharge", hint: "percentage of recharge amount", items: [
    { n: "Tata Play", a: "TP", c: "#3B0764", m: "2.5%" }, { n: "Airtel Digital TV", a: "Ai", c: "#E40000", m: "2.0%" },
    { n: "Dish TV", a: "DT", c: "#F07800", m: "3.0%" }, { n: "d2h", a: "d2", c: "#D81F26", m: "3.25%" },
    { n: "Sun Direct", a: "SD", c: "#B5790E", m: "3.5%" },
  ]},
  { group: "Bill Payments", hint: "flat margin per bill", items: [
    { n: "Electricity Bill", a: "EL", c: "#F07800", m: "Rs 5 / bill" }, { n: "Water Bill", a: "WA", c: "#0A7A9E", m: "Rs 4 / bill" },
    { n: "Piped Gas Bill", a: "GA", c: "#008540", m: "Rs 5 / bill" }, { n: "LPG Cylinder Booking", a: "LP", c: "#D81F26", m: "Rs 6 / booking" },
  ]},
  { group: "FASTag", hint: "percentage of recharge amount", items: [{ n: "All Banks", a: "FT", c: "#7B2FBE", m: "0.25%" }] },
  { group: "Banking Services", hint: "as per transaction slab", items: [
    { n: "AEPS Cash Withdrawal", a: "AE", c: "#00A389", m: "Rs 8 / txn" },
    { n: "Money Transfer (DMT)", a: "MT", c: "#7B2FBE", m: "0.5%", sub: "minimum Rs 5 per transfer" },
    { n: "Aadhaar Pay", a: "AP", c: "#0112FE", m: "0.4%" },
  ]},
];

export default function DiscountPage() {
  return (
    <>
      <SubHeader title="Discount Chart" backHref="/" />
      <div className="p-4">
        <div className="mb-3.5 flex gap-2 rounded-xl bg-teal-soft px-3.5 py-3 text-[11.5px] font-semibold leading-relaxed text-teal">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-[15px] w-[15px] flex-none fill-teal"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2Zm0-8h-2V7h2Z" /></svg>
          Your margin on every transaction. Commission is credited to your wallet automatically after each successful transaction.
        </div>
        {GROUPS.map((g) => (
          <div key={g.group}>
            <div className="mb-2 mt-4 px-1 text-[11px] font-bold uppercase tracking-wider text-text-3 first:mt-0">
              {g.group} · <span className="normal-case tracking-normal">{g.hint}</span>
            </div>
            {g.items.map((x) => (
              <div key={x.n} className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl font-display text-[12px] font-bold text-white" style={{ background: x.c }}>{x.a}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold">{x.n}</div>
                  {"sub" in x && x.sub && <div className="mt-0.5 text-[10.5px] text-text-3">{x.sub}</div>}
                </div>
                <div className="mono flex-none text-[14px] font-bold text-teal">{x.m}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
