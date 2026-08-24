"use client";

import { useEffect } from "react";
import { useSessionExpiryStore } from "@/lib/auth/sessionExpiryStore";

export function SessionExpiredOverlay() {
  const expired = useSessionExpiryStore((state) => state.expired);

  useEffect(() => {
    if (!expired) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expired]);

  if (!expired) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center bg-text-1/20 p-5 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      aria-describedby="session-expired-description"
      tabIndex={-1}
    >
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-orange" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
          </svg>
        </div>
        <h2 id="session-expired-title" className="mt-4 font-display text-[17px] font-semibold text-text-1">
          Session expired
        </h2>
        <p id="session-expired-description" className="mt-2 text-[12.5px] leading-relaxed text-text-2">
          For your security, this session is no longer active. Please close this tab or application and reopen EG Merchant from your dashboard.
        </p>
      </div>
    </div>
  );
}
