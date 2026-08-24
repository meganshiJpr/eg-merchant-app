"use client";

import { useEffect } from "react";
import { useUIHistoryLayer } from "@/lib/history/UIHistoryContext";

export function Sheet({
  id,
  open,
  onClose,
  children,
}) {
  const { close } = useUIHistoryLayer({
    id,
    type: "sheet",
    open: Boolean(open),
    onClose,
  });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleManualClose = () => {
    close();
    
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity" onClick={handleManualClose} aria-hidden />
      <div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-app"
      >
        {/* Close button */}
        <button
          onClick={handleManualClose}
          aria-label="Close"
          className="absolute -top-4 left-1/2 z-50 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-md transition active:scale-90"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 fill-text-2"
          >
            <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3Z" />
          </svg>
        </button>

        {/* Actual bottom sheet */}
        <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-t-2xl bg-surface px-4 pb-4 pt-5 shadow-2xl">
          {children}
        </div>
      </div>
    </>
  );
}
