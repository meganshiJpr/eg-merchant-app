"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

/** 4-digit MPIN with a custom numeric keypad — the system keyboard can
 *  never appear. Auto-submits on the 4th digit. Guards wallet debits only. */
export function MpinSheet({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setPin("");
      setVerifying(false);
    }
  }, [open]);

  useEffect(() => {
    if (pin.length === 4 && !verifying) {
      setVerifying(true);
      /* Production: POST /recharge { ..., mpin } over the JWT session */
      const t = setTimeout(() => onComplete(pin), 900);
      return () => clearTimeout(t);
    }
  }, [pin, verifying, onComplete]);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="text-center font-display text-[15px] font-semibold">Enter 4-digit MPIN</div>
      <div className="my-5 flex justify-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length ? "border-primary bg-primary" : "border-border"
            }`}
          />
        ))}
      </div>
      <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2.5">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              disabled={verifying}
              onClick={() =>
                setPin((p) => (k === "back" ? p.slice(0, -1) : p.length < 4 ? p + k : p))
              }
              className="mono flex h-[54px] items-center justify-center rounded-2xl border border-border bg-page text-[20px] font-semibold active:bg-primary-soft"
            >
              {k === "back" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-text-2">
                  <path d="M22 5H8L2 12l6 7h14a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 22 5Zm-4.3 9.3-1.4 1.4L14 13.4l-2.3 2.3-1.4-1.4L12.6 12l-2.3-2.3 1.4-1.4L14 10.6l2.3-2.3 1.4 1.4L15.4 12Z" />
                </svg>
              ) : (
                k
              )}
            </button>
          ),
        )}
      </div>
      <div className="mt-4 min-h-[18px] text-center text-[12px] font-semibold text-text-3">
        {verifying ? "Verifying..." : ""}
      </div>
    </Sheet>
  );
}
