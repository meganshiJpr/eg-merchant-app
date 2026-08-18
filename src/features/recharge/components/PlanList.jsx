"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, PLAN_CATS, perDay, inr } from "../data";
import { useRecharge } from "../store";
import { Sheet } from "@/components/ui/Sheet";

function Benefits({ p }) {
  const cells = [
    [p.calls, "Calls"],
    [p.sms, "SMS"],
    [p.data, "Data"],
    [p.val, "Validity"],
  ];
  return (
    <div className="grid grid-cols-4 divide-x divide-border rounded-xl bg-page py-2">
      {cells.map(([v, l]) => (
        <div key={l} className="px-1 text-center">
          <div className="text-[11px] font-semibold leading-tight">{v}</div>
          <div className="mt-0.5 text-[9.5px] text-text-3">{l}</div>
        </div>
      ))}
    </div>
  );
}

function OttMinis({ p }) {
  if (!p.ott.length) return <span />;
  return (
    <span className="flex items-center">
      {p.ott.map((o, i) => (
        <span
          key={o.n}
          className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-surface font-display text-[9px] font-extrabold text-white ${i ? "-ml-1.5" : ""}`}
          style={{ background: o.c }}
        >
          {o.ic}
        </span>
      ))}
      <span className="ml-1.5 text-[10px] font-semibold text-text-3">
        {p.ott.length} benefit{p.ott.length > 1 ? "s" : ""}
      </span>
    </span>
  );
}

export function PlanList() {
  const router = useRouter();
  const flow = useRecharge();
  const [cat, setCat] = useState(0);
  const [q, setQ] = useState("");
  const [sheetPlan, setSheetPlan] = useState(null);

  const searching = q.trim().length > 0;
  const qDigits = /^\d+$/.test(q.trim()) ? parseInt(q.trim(), 10) : 0;
  const amountMode = qDigits >= 10;

  const { plans, showCustom } = useMemo(() => {
    let list = PLANS.filter((p) => searching || p.cat === PLAN_CATS[cat]);
    let custom = false;
    if (searching) {
      if (amountMode) {
        const exact = list.filter((p) => p.amt === qDigits);
        if (exact.length) list = exact;
        else {
          list = list.filter((p) => p.amt > qDigits).sort((a, b) => a.amt - b.amt);
          custom = qDigits <= 25000;
        }
      } else {
        const needle = q.trim().toLowerCase();
        list = list.filter((p) =>
          `${p.amt} ${p.val} ${p.calls} ${p.sms} ${p.data} ${p.cat} ${p.desc} ${p.full} ${p.ott.map((o) => o.n).join(" ")}`
            .toLowerCase()
            .includes(needle),
        );
      }
    }
    return { plans: list, showCustom: custom };
  }, [q, cat, searching, amountMode, qDigits]);

  function select(plan, customAmt) {
    flow.set({ plan, customAmt });
    router.push("/recharge/pay");
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-2.5 focus-within:border-primary">
        <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none fill-text-3">
          <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search plans (amount, data, OTT, validity...)"
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-3"
        />
      </div>

      {!searching && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {PLAN_CATS.map((c, i) => (
            <button
              key={c}
              onClick={() => setCat(i)}
              className={`flex-none rounded-full border-[1.5px] px-3.5 py-1.5 text-[11.5px] font-semibold ${
                i === cat
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-page text-text-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2.5">
        {showCustom && (
          <button
            onClick={() => select(null, qDigits)}
            className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-primary bg-surface p-3.5 text-left active:scale-[0.985]"
          >
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-soft">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-primary">
                <rect x="6.5" y="1.5" width="11" height="21" rx="2.8" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[14px] font-semibold">
                Recharge with <span className="mono">Rs {inr(qDigits)}</span>
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-text-2">
                We could not find this exact plan, but you can still continue
              </span>
            </span>
            <Chevron />
          </button>
        )}

        {plans.map((p) => (
          <button
            key={p.amt + p.cat}
            onClick={() => select(p, null)}
            className="rounded-2xl border border-border bg-surface p-3.5 text-left active:scale-[0.985]"
          >
            <div className="flex items-center">
              <span className="mono text-[17px] font-semibold">Rs {inr(p.amt)}</span>
              {perDay(p) && (
                <span className="mono ml-2 text-[10.5px] font-semibold text-text-3">{perDay(p)}</span>
              )}
              <span className="ml-auto flex items-center">
                {searching && (
                  <span className="mr-2 rounded-full border border-border bg-page px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-text-3">
                    {p.cat}
                  </span>
                )}
                <Chevron />
              </span>
            </div>
            <div className="mt-2.5">
              <Benefits p={p} />
            </div>
            <div className="mt-2 text-[11.5px] text-text-2">{p.desc}</div>
            <div className="mt-2 flex items-center justify-between">
              <OttMinis p={p} />
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setSheetPlan(p);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    setSheetPlan(p);
                  }
                }}
                className="flex items-center gap-0.5 text-[11.5px] font-semibold text-primary"
              >
                View more
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary">
                  <path d="M7 10l5 5 5-5Z" />
                </svg>
              </span>
            </div>
          </button>
        ))}

        {!plans.length && !showCustom && (
          <div className="py-6 text-center text-[12.5px] text-text-3">No plans match your search</div>
        )}
      </div>

      <Sheet open={!!sheetPlan} onClose={() => setSheetPlan(null)}>
        {sheetPlan && (
          <>
            <div className="flex items-baseline justify-between">
              <span className="mono text-[22px] font-semibold">Rs {inr(sheetPlan.amt)}</span>
              <span className="mono text-[11px] font-semibold text-text-3">{perDay(sheetPlan)}</span>
            </div>
            <div className="mt-3">
              <Benefits p={sheetPlan} />
            </div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-text-3">Description</div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-2">{sheetPlan.full}</p>
            {sheetPlan.ott.length > 0 && (
              <>
                <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-text-3">
                  Additional benefits
                </div>
                {sheetPlan.ott.map((o) => (
                  <div key={o.n} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                    <span
                      className="flex h-8 w-8 flex-none items-center justify-center rounded-lg font-display text-[13px] font-extrabold text-white"
                      style={{ background: o.c }}
                    >
                      {o.ic}
                    </span>
                    <span>
                      <span className="block text-[12.5px] font-semibold">{o.n}</span>
                      <span className="block text-[11px] text-text-3">{o.d}</span>
                    </span>
                  </div>
                ))}
              </>
            )}
            <button
              onClick={() => {
                const p = sheetPlan;
                setSheetPlan(null);
                select(p, null);
              }}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white"
            >
              Select This Plan
            </button>
          </>
        )}
      </Sheet>
    </div>
  );
}

function Chevron() {
  return (
    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-soft">
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary">
        <path d="M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3Z" />
      </svg>
    </span>
  );
}
