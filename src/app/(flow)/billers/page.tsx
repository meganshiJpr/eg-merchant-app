"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { BillerList } from "@/features/billers/components/BillerList";
import { BILLERS } from "@/features/billers/data";

function BillersInner() {
  const params = useSearchParams();
  const cat = Math.max(0, Math.min(4, parseInt(params.get("cat") ?? "0", 10)));
  return (
    <>
      <SubHeader title={BILLERS[cat].title} backHref="/" />
      <BillerList catIndex={cat} />
    </>
  );
}

export default function BillersPage() {
  return (
    <Suspense>
      <BillersInner />
    </Suspense>
  );
}
