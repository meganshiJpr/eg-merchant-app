"use client";

export function MenuGroup({ label, children }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-2">
      {label && (
        <div className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-text-3">{label}</div>
      )}
      {children}
    </section>
  );
}

export function MenuRow({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
  onClick,
  right,
  danger,
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-page"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl" style={{ background: iconBg }}>
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" style={{ fill: iconColor }}>
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-semibold ${danger ? "text-accent" : ""}`}>{title}</span>
        {sub && <span className="block text-[11px] text-text-3">{sub}</span>}
      </span>
      {right ?? (
        <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none fill-text-3">
          <path d="M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3Z" />
        </svg>
      )}
    </button>
  );
}
