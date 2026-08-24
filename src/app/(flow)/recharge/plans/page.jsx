"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlanSelectionView } from "@/features/recharge/components/PlanSelectionView";
import { useRecharge } from "@/features/recharge/store";

export default function RechargePlansPage() {
  const router = useRouter();
  const flow = useRecharge();

  useEffect(() => {
    // If no phone number is present in store (even after sessionStorage restore), redirect to /recharge
    if (!flow.num && typeof window !== "undefined") {
      try {
        const savedSession = sessionStorage.getItem("recharge_flow_session");
        if (!savedSession || !savedSession.includes('"num"')) {
          router.replace("/recharge");
        }
      } catch {
        router.replace("/recharge");
      }
    }
  }, [flow.num, router]);

  function back() {
    flow.reset();
    router.push("/recharge");
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={back}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95 transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-text-1">
            <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
          </svg>
        </button>
        <h1 className="font-display text-[16px] font-semibold">Select Recharge Plan</h1>
      </div>

      <PlanSelectionView onEdit={back} />
    </div>
  );
}
