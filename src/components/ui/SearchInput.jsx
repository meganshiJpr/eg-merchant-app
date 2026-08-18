"use client";

export function SearchInput({
  value,
  onChange,
  placeholder,
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-2.5 focus-within:border-primary">
      <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none fill-text-3">
        <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-3"
      />
    </div>
  );
}
