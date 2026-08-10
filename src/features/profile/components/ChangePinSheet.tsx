"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";

export function ChangePinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast((t) => t.show);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");

  function submit() {
    if (cur.length !== 4 || next.length !== 4 || conf.length !== 4) return setErr("All PINs must be 4 digits.");
    if (next !== conf) return setErr("New PIN and confirmation do not match.");
    if (next === cur) return setErr("New PIN must be different from the current one.");
    /* Production: POST /profile/mpin { current, next } */
    setErr(""); setCur(""); setNext(""); setConf("");
    onClose();
    toast("MPIN changed successfully");
  }

  const field = (label: string, val: string, set: (v: string) => void) => (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{label}</label>
      <input
        value={val}
        onChange={(e) => set(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        type="password"
        maxLength={4}
        placeholder="••••"
        className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[16px] tracking-[0.5em] outline-none focus:border-primary"
      />
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-3 font-display text-[15px] font-semibold">Change MPIN</div>
      <div className="flex flex-col gap-3">
        {field("Current MPIN", cur, setCur)}
        {field("New MPIN", next, setNext)}
        {field("Confirm New MPIN", conf, setConf)}
      </div>
      {err && <div className="mt-2.5 text-[11.5px] font-semibold text-accent">{err}</div>}
      <button onClick={submit} className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white">
        Update MPIN
      </button>
    </Sheet>
  );
}
