"use client";

export const DATE_RANGES = [
  { label: "Today", days: 1 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "All", days: 0 },
];

export function DateChips({
  ranges = DATE_RANGES,
  active,
  onChange,
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ranges.map((r, i) => (
        <button
          key={r.label}
          onClick={() => onChange(i)}
          className={`flex-none rounded-full border-[1.5px] px-3.5 py-1.5 text-[11.5px] font-semibold ${
            i === active
              ? "border-primary bg-primary-soft text-primary"
              : "border-border bg-page text-text-2"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
