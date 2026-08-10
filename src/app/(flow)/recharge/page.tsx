"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NumberEntry } from "@/features/recharge/components/NumberEntry";
import { SelectedNumber } from "@/features/recharge/components/SelectedNumber";
import { PlanList } from "@/features/recharge/components/PlanList";
import { useRecharge } from "@/features/recharge/store";

export default function RechargePage() {
  const router = useRouter();
  const flow = useRecharge();
  const [stage, setStage] = useState<"entry" | "plans">(flow.operator ? "plans" : "entry");

  function back() {
    // Smart back (locked): plans → entry → home
    if (stage === "plans") {
      flow.reset();
      setStage("entry");
    } else {
      router.push("/");
    }
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={back}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-text-1">
            <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
          </svg>
        </button>
        <h1 className="font-display text-[16px] font-semibold">Mobile Recharge</h1>
      </div>

      {/* Promo slot — banner API placement "recharge_top" in production */}
      <div className="mb-4 flex h-[108px] items-center rounded-2xl bg-gradient-to-r from-primary to-violet px-4 text-white">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            Recharge offer
          </div>
          <div className="mt-0.5 max-w-[230px] font-display text-[15px] font-semibold leading-snug">
            Extra 1% commission on annual plans
          </div>
        </div>
      </div>

      {stage === "entry" && <NumberEntry onDetected={() => setStage("plans")} />}
      {stage === "plans" && (
        <>
          <SelectedNumber onEdit={back} />
          <PlanList />
        </>
      )}
    </div>
  );
}
