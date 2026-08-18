import { forwardRef } from "react";

export const Button = forwardRef(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  const base =
    "w-full rounded-xl px-4 py-3.5 font-display text-[13.5px] font-semibold transition active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-primary text-white"
      : "border-[1.5px] border-border bg-surface text-text-1";
  return <button ref={ref} className={`${base} ${styles} ${className}`} {...props} />;
});
