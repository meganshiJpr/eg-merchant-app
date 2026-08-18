"use client";

import { useState } from "react";
import { CIRCLES, OPERATORS, fmtNum } from "../data";
import { useRecharge } from "../store";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";

export function SelectedNumber({ onEdit }) {
  const flow = useRecharge();
  const toast = useToast((t) => t.show);
  const [sheet, setSheet] = useState(null);
  const [pendingOp, setPendingOp] = useState(0);

  if (!flow.operator) return null;
  const op = flow.operator;

  function applyCircle(i) {
    const operator = OPERATORS[pendingOp];
    const circle = CIRCLES[i];
    flow.set({ operator, circle });
    setSheet(null);
    toast(`${operator.name} · ${circle}`);
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-primary bg-surface px-3.5 py-3">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-[12px] font-bold text-white"
          style={{ background: op.color }}
        >
          {op.abbr}
        </span>
        <div className="min-w-0 flex-1">
          <button onClick={onEdit} className="flex items-center gap-1.5 text-[13.5px] font-semibold">
            {flow.name && <span>{flow.name} ·</span>}
            <span className="mono font-medium text-text-2">{fmtNum(flow.num)}</span>
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary">
              <path d="M3 17.2V21h3.8L17.9 9.9l-3.8-3.8ZM20.7 7.1a1 1 0 0 0 0-1.4L18.3 3.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8Z" />
            </svg>
          </button>
          <div className="mt-0.5 text-[11.5px] text-text-2">
            {op.name} · {flow.circle} · Prepaid
          </div>
        </div>
        <button
          onClick={() => {
            setPendingOp(OPERATORS.findIndex((o) => o.id === op.id));
            setSheet("op");
          }}
          className="flex-none rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-[11.5px] font-bold text-primary"
        >
          Change
        </button>
      </div>

      {/* Two-step operator → circle sheet */}
      <Sheet open={sheet === "op"} onClose={() => setSheet(null)}>
        <div className="mb-3 font-display text-[15px] font-semibold">Select operator</div>
        {OPERATORS.map((o, i) => (
          <button
            key={o.id}
            onClick={() => {
              setPendingOp(i);
              setSheet("circle");
            }}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-border bg-page px-3 py-2.5 text-left"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full font-display text-[11px] font-bold text-white"
              style={{ background: o.color }}
            >
              {o.abbr}
            </span>
            <span className="text-[13px] font-semibold">{o.name}</span>
          </button>
        ))}
      </Sheet>

      <Sheet open={sheet === "circle"} onClose={() => setSheet(null)}>
        <div className="mb-1 font-display text-[15px] font-semibold">Select circle</div>
        <button
          onClick={() => setSheet("op")}
          className="mb-3 flex items-center gap-1 text-[11.5px] font-semibold text-primary"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary">
            <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
          </svg>
          {OPERATORS[pendingOp].name} selected · change
        </button>
        {CIRCLES.map((c, i) => (
          <button
            key={c}
            onClick={() => applyCircle(i)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-border bg-page px-3 py-2.5 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft font-display text-[12px] font-bold text-primary">
              {c[0]}
            </span>
            <span className="text-[13px] font-semibold">{c}</span>
          </button>
        ))}
      </Sheet>
    </>
  );
}
