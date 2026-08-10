"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BILLERS, BUTTON_LABEL, type Field } from "../data";
import { useBill } from "../store";

function validField(f: Field, raw: string): boolean {
  const v = raw.trim();
  if (f.type === "sel") return v.length > 0;
  if (f.type === "date") {
    if (v.length !== 10) return false;
    const dd = +v.slice(0, 2), mm = +v.slice(3, 5);
    return dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12;
  }
  const chars = f.type === "txt" ? v : v.replace(/\D/g, "");
  return chars.length >= (f.min ?? 4) && (!f.max || chars.length <= f.max);
}

function formatField(f: Field, v: string): string {
  if (f.type === "num") return v.replace(/\D/g, "");
  if (f.type === "txt") return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (f.type === "date") {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }
  return v;
}

export function BillForm({ catIndex, billerIndex }: { catIndex: number; billerIndex: number }) {
  const router = useRouter();
  const setBill = useBill((s) => s.set);
  const cat = BILLERS[catIndex];
  const biller = cat.items[billerIndex];

  const [values, setValues] = useState<string[]>(() => biller.fields.map(() => ""));
  const [fetching, setFetching] = useState(false);

  const valid = useMemo(
    () => biller.fields.every((f, i) => validField(f, values[i])),
    [biller.fields, values],
  );

  function update(i: number, raw: string) {
    setValues((prev) => {
      const next = [...prev];
      next[i] = formatField(biller.fields[i], raw);
      return next;
    });
  }

  function proceed() {
    const account = values.join(" · ");
    const base = {
      biller, catTitle: cat.title, catIndex, account,
      line2: `${cat.title} · ${account}`,
      amin: cat.amin, amax: cat.amax,
    };

    if (biller.btn === "proceed") {
      // FASTag etc — amount entered on confirmation, no fetch
      setBill({ ...base, amount: 0, editable: true, rowsTitle: null, rows: null, custName: null });
      router.push("/billers/pay");
      return;
    }

    // fetch / customer-info runs during the transition (spinner), production: POST /bills/fetch
    setFetching(true);
    setTimeout(() => {
      if (biller.btn === "fetch") {
        const due = new Date(Date.now() + 7 * 86400000);
        setBill({
          ...base, amount: 1240, editable: biller.aedit === true,
          rowsTitle: "Bill details", custName: "RAJESH KUMAR",
          rows: [
            { k: "Customer name", v: "RAJESH KUMAR" },
            { k: "Bill amount", v: "Rs 1,240" },
            { k: "Due date", v: due.toLocaleDateString("en-IN") },
          ],
        });
      } else {
        setBill({
          ...base, amount: 0, editable: true,
          rowsTitle: "Customer info", custName: "RAJESH KUMAR",
          rows: [
            { k: "Customer name", v: "RAJESH KUMAR" },
            { k: "Status", v: "Active" },
            { k: "Current plan", v: "Monthly · Rs 350" },
          ],
        });
      }
      router.push("/billers/pay");
    }, 1100);
  }

  return (
    <div className="p-4">
      {/* Biller header */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3">
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl font-display text-[12px] font-bold text-white"
          style={{ background: biller.c }}
        >
          {biller.a}
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold">{biller.n}</div>
          <div className="text-[11.5px] text-text-2">{biller.sub}</div>
        </div>
      </div>

      {/* Dynamic fields */}
      <div className="flex flex-col gap-3">
        {biller.fields.map((f, i) => (
          <div key={f.label}>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">
              {f.label} <span className="text-accent">*</span>
            </label>
            {f.type === "sel" ? (
              <select
                value={values[i]}
                onChange={(e) => update(i, e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select {f.label.toLowerCase()}
                </option>
                {f.options!.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                value={values[i]}
                onChange={(e) => update(i, e.target.value)}
                inputMode={f.type === "num" || f.type === "date" ? "numeric" : "text"}
                maxLength={f.type === "date" ? 10 : f.max}
                placeholder={f.ph}
                className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary placeholder:font-body placeholder:text-text-3"
              />
            )}
          </div>
        ))}
      </div>

      {fetching && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[12.5px] text-text-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          {biller.btn === "fetch" ? "Fetching bill details..." : "Fetching customer info..."}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3">
        <button
          disabled={!valid || fetching}
          onClick={proceed}
          className="w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100"
        >
          {BUTTON_LABEL[biller.btn]}
        </button>
      </div>
    </div>
  );
}
