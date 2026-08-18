"use client";

import { useRouter } from "next/navigation";

export function SubHeader({ title, backHref }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <button
        onClick={() => (backHref ? router.push(backHref) : router.back())}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-text-1">
          <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
        </svg>
      </button>
      <h1 className="font-display text-[16px] font-semibold">{title}</h1>
    </div>
  );
}
