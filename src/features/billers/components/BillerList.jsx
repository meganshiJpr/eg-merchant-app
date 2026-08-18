"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BILLERS } from "../data";
import { SearchInput } from "@/components/ui/SearchInput";

export function BillerList({ catIndex }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const cat = BILLERS[catIndex];

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cat.items.filter((b) => !needle || `${b.n} ${b.sub}`.toLowerCase().includes(needle));
  }, [q, cat]);

  return (
    <div className="p-4">
      <div className="mb-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search operator" />
      </div>
      <div className="flex flex-col gap-2">
        {items.map((b) => (
          <button
            key={b.n}
            onClick={() => router.push(`/billers/form?cat=${catIndex}&biller=${cat.items.indexOf(b)}`)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left active:scale-[0.985]"
          >
            <span
              className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl font-display text-[13px] font-bold text-white"
              style={{ background: b.c }}
            >
              {b.a}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-semibold">{b.n}</span>
              <span className="block text-[11px] text-text-3">{b.sub}</span>
            </span>
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-soft">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-primary">
                <path d="M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3Z" />
              </svg>
            </span>
          </button>
        ))}
        {!items.length && (
          <div className="py-6 text-center text-[12.5px] text-text-3">
            No operator matches your search
          </div>
        )}
      </div>
    </div>
  );
}
