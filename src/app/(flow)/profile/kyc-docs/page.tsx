"use client";

import { SubHeader } from "@/components/ui/SubHeader";
import { Pill } from "@/components/ui/Pill";
import { useAuthStore } from "@/lib/auth/store";

const DOCS = [
  { label: "Aadhaar (eKYC)", status: "approved", tag: "Verified" },
  { label: "PAN card", status: "pending", tag: "Under review" },
  { label: "Selfie / liveness", status: "approved", tag: "Verified" },
  { label: "Shop photo", status: "approved", tag: "Verified" },
];

export default function KycDocsPage() {
  const kyc = useAuthStore((s) => s.merchant?.kycStatus) ?? "review";
  return (
    <>
      <SubHeader title="KYC Documents" backHref="/profile" />
      <div className="flex flex-col gap-3 p-4">
        <div className={`rounded-xl px-3.5 py-3 text-[12px] font-semibold ${kyc === "verified" ? "bg-teal-soft text-teal" : "bg-teal-soft text-teal"}`}>
          {kyc === "verified" ? "Your KYC is fully verified." : "Your KYC is under review. We'll notify you once approved."}
        </div>
        {DOCS.map((d) => (
          <div key={d.label} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-soft">
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-violet"><path d="M6 2h9l5 5v15H6Zm8 1.5V8h4.5Z" /></svg>
              </span>
              <span className="text-[13px] font-semibold">{d.label}</span>
            </div>
            <Pill tone={d.status}>{d.tag}</Pill>
          </div>
        ))}
      </div>
    </>
  );
}
