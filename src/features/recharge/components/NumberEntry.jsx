"use client";

import { useMemo, useState } from "react";
import { SUGGESTS, detectOperator, fmtNum } from "../data";
import { useRecharge } from "../store";

const TAG_LABEL = { self: "My number", recent: "Recent recharges", contact: "Contacts" };
const TAG_ORDER = { self: 0, recent: 1, contact: 2 };

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}

export function NumberEntry({ onDetected }) {
  const flow = useRecharge();
  const [value, setValue] = useState("");
  const [detecting, setDetecting] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    return SUGGESTS.filter(
      (s) => !q || s.num.includes(q) || s.name.toLowerCase().includes(q),
    ).sort((a, b) => TAG_ORDER[a.tag] - TAG_ORDER[b.tag]);
  }, [value]);

  function detect(num, name) {
    setDetecting(true);
    setTimeout(() => {
      flow.set({ num, name, operator: detectOperator(num), circle: "Rajasthan" });
      setDetecting(false);
      onDetected();
    }, 900);
  }

  function onInput(v) {
    const clean = v.replace(/[^0-9a-zA-Z ]/g, "");
    setValue(clean);
    const digits = clean.replace(/\D/g, "");
    if (digits.length === 10 && digits === clean) detect(digits, null);
  }

  function pick(s) {
    setValue(s.num);
    detect(s.num, s.name);
  }

  let lastTag = "";
  return (
    <div>
      <div className="mb-2 text-[12.5px] font-semibold text-text-2">Customer mobile number</div>
      <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 focus-within:border-primary">
        <span className="mono text-[14px] font-medium text-text-3">+91</span>
        <input
          value={value}
          onChange={(e) => onInput(e.target.value)}
          inputMode="numeric"
          maxLength={10}
          placeholder="Search name or enter number"
          className="mono min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:font-body placeholder:text-text-3"
        />
      </div>

      {detecting ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[12.5px] text-text-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          Detecting operator and circle...
        </div>
      ) : (
        <div className="mt-3">
          {filtered.map((s) => {
            const label = s.tag !== lastTag ? TAG_LABEL[s.tag] : null;
            lastTag = s.tag;
            return (
              <div key={s.num}>
                {label && (
                  <div className="mb-1.5 mt-2.5 px-1 text-[11px] font-bold uppercase tracking-wider text-text-3">
                    {label}
                  </div>
                )}
                <button
                  onClick={() => pick(s)}
                  className="mb-1.5 flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left active:scale-[0.985]"
                >
                  <span
                    className="flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-[13px] font-bold text-white"
                    style={{ background: s.color }}
                  >
                    {initials(s.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{s.name}</span>
                    <span className="mono block text-[11.5px] text-text-3">{fmtNum(s.num)}</span>
                  </span>
                  <span
                    className={`flex-none rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      s.tag === "self"
                        ? "bg-primary-soft text-primary"
                        : s.tag === "recent"
                          ? "bg-teal-soft text-teal"
                          : "border border-border bg-page text-text-3"
                    }`}
                  >
                    {s.tag === "self" ? "Self" : s.tag}
                  </span>
                </button>
              </div>
            );
          })}
          {!filtered.length && value && value.length < 10 && (
            <div className="py-3 text-center text-[12px] text-text-3">
              No match in your list — keep typing the full number
            </div>
          )}
        </div>
      )}
    </div>
  );
}
