"use client";

import { useRouter } from "next/navigation";

export function SubHeader({ title, backHref, showImg = true }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-primary px-4 py-3">
      <button
        onClick={handleBack}
        aria-label="Back"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-2xs transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-primary">
          <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
        </svg>
      </button>
      <h1 className="font-display text-[16px] text-white font-semibold">{title}</h1>
      {showImg && (
        <img src="/bharat-connect-reverse-logo.png" alt="Bharat Connect" className="h-[2.55rem] ml-auto object-containn" />
      )}  
    </div>
  );
}
