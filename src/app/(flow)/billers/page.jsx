"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { BillerList } from "@/features/billers/components/BillerList";

const CATEGORY_MAP = {
  0: "DTH",
  1: "Electricity",
  2: "Water",
  3: "Gas",
  4: "FASTag",
  dth: "DTH",
  electricity: "Electricity",
  water: "Water",
  gas: "Gas",
  fastag: "FASTag",
};


function BillersInner() {
  const params = useSearchParams();
  const rawType = params.get("type");
  const rawCat = params.get("cat");

  let categoryType = "DTH";
  if (rawType) {
    categoryType = rawType;
  } else if (rawCat !== null) {
    categoryType = CATEGORY_MAP[rawCat] || CATEGORY_MAP[parseInt(rawCat, 10)] || "DTH";
  }

  const catIndex = Math.max(
    0,
    Math.min(4, parseInt(rawCat ?? "0", 10))
  );

  const type = params.get("type") || "DTH";
  const formattedType = type
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/^./, (char) => char.toUpperCase());

  return (
    <>
      <SubHeader title={formattedType} backHref="/" />
      <BillerList categoryType={categoryType} catIndex={catIndex} />
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