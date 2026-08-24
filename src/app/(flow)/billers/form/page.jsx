"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { BillForm } from "@/features/billers/components/BillForm";
import { BILLERS } from "@/features/billers/data";

const CATEGORY_MAP = {
  0: "DTH",
  1: "Electricity",
  2: "Water",
  3: "Gas",
  4: "FASTag",
};

const TITLE_MAP = {
  DTH: "DTH Recharge",
  Electricity: "Electricity Bill",
  Water: "Water Bill",
  Gas: "Gas Bill",
  FASTag: "FASTag Recharge",
};

function FormInner() {
  const params = useSearchParams();
  const rawType = params.get("type");
  const rawCat = params.get("cat");
  const operatorId = params.get("operator");
  const initialNumber = params.get("number") || "";

  let categoryType = "DTH";
  if (rawType) {
    categoryType = rawType;
  } else if (rawCat !== null) {
    categoryType = CATEGORY_MAP[rawCat] || CATEGORY_MAP[parseInt(rawCat, 10)] || "DTH";
  }

  const catIndex = Math.max(0, Math.min(4, parseInt(rawCat ?? "0", 10)));
  const billerIndex = parseInt(params.get("biller") ?? "0", 10);
  const title = TITLE_MAP[categoryType] || BILLERS[catIndex]?.title || `${categoryType} Bill`;

  const backUrl = rawType ? `/billers?type=${rawType}` : `/billers?cat=${catIndex}`;

  return (
    <>
      <SubHeader title={title} backHref={backUrl} />
      <BillForm
        categoryType={categoryType}
        catIndex={catIndex}
        billerIndex={billerIndex}
        operatorId={operatorId}
        initialNumber={initialNumber}
      />
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
