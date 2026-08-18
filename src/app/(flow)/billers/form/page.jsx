"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { BillForm } from "@/features/billers/components/BillForm";
import { BILLERS } from "@/features/billers/data";

function FormInner() {
  const params = useSearchParams();
  const cat = Math.max(0, Math.min(4, parseInt(params.get("cat") ?? "0", 10)));
  const biller = parseInt(params.get("biller") ?? "0", 10);
  return (
    <>
      <SubHeader title={BILLERS[cat].title} backHref={`/billers?cat=${cat}`} />
      <BillForm catIndex={cat} billerIndex={biller} />
    </>
  );
}

export default function BillFormPage() {
  return (
    <Suspense>
      <FormInner />
    </Suspense>
  );
}
