"use client";

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-app rounded-t-2xl bg-surface px-4 pb-6 pt-5">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface shadow-md"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-text-2">
            <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3Z" />
          </svg>
        </button>
        {children}
      </div>
    </>
  );
}
