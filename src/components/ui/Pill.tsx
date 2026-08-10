const MAP: Record<string, string> = {
  success: "bg-teal-soft text-teal",
  processing: "bg-orange-soft text-orange",
  pending: "bg-orange-soft text-orange",
  failed: "bg-accent-soft text-accent",
  rejected: "bg-accent-soft text-accent",
  refunded: "bg-violet-soft text-violet",
  approved: "bg-teal-soft text-teal",
  open: "bg-orange-soft text-orange",
  progress: "bg-violet-soft text-violet",
};

export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-wide ${MAP[tone] ?? "bg-page text-text-3"}`}
    >
      {children}
    </span>
  );
}
