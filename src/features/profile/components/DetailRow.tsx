export function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="flex-none text-[12px] text-text-3">{label}</span>
      <span className={`text-right text-[12.5px] font-semibold ${mono ? "mono" : ""}`}>{value}</span>
    </div>
  );
}
