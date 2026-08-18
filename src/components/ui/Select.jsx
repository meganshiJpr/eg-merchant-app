"use client";

export function Select({
  value,
  onChange,
  options,
  className = "",
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-xl border-[1.5px] border-border bg-surface px-3 py-2.5 text-[12.5px] outline-none focus:border-primary ${className}`}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
