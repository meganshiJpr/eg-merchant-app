"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { getUserKyc } from "@/features/profile/api";


export function KycStepBanner() {
  const router = useRouter();
  const merchant = useAuthStore((s) => s.merchant);

  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const res = await getUserKyc();
        setKycData(res?.data || res);
      } catch (error) {
        console.error("Failed to fetch KYC status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKycStatus();
  }, []);

  if (
    merchant?.isKycCompleted ||
    merchant?.kycStatus === "verified" ||
    kycData?.isKycCompleted ||
    kycData?.kyc_status === "verified"
  ) {
    return null;
  }

if (loading) return null;

const history = kycData?.history_data || {};

const normalizeStatus = (status) => {
  const value = String(status || "pending").toLowerCase().trim();

  if (["approved", "completed"].includes(value)) return "completed";
  if (value === "rejected") return "rejected";
  if (value === "processing") return "processing";

  return "pending";
};

const steps = [
  { id: 1, label: "Aadhaar", status: normalizeStatus(history.id_status) },
  { id: 2, label: "PAN", status: normalizeStatus(history.pan_status) },
  { id: 3, label: "Selfie", status: normalizeStatus(history.selfie_status) },
  { id: 4, label: "Video", status: normalizeStatus(history.video_status) },
];

// Only pending/rejected steps require user action
const firstActionRequiredIndex = steps.findIndex(
  (step) => step.status === "pending" || step.status === "rejected"
);

// Hide banner if all steps are completed or processing
if (firstActionRequiredIndex === -1) {
  return null;
}

const completedCount = steps.filter(
  (step) => step.status === "completed"
).length;

const activeStep = firstActionRequiredIndex;

const getStepStatus = (step, index) => {
  if (step.status === "completed") return "completed";
  if (index === activeStep) return "active";
  return "pending";
};

const currentStep = steps[activeStep];

  return (
    <div className="rounded-2xl border-2 border-orange/40 bg-surface p-2 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-orange-soft">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-orange">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14h2v2h-2v-2zm0-8h2v6h-2V8z" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold text-text">
            Complete your KYC
          </h3>

          <p className="mt-0.5 text-[12px] text-text-2">
            {completedCount} of {steps.length} steps done
            {currentStep && ` · ${currentStep.label} verification ${currentStep.status}`}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-4 flex items-center justify-between px-2">
        {steps.map((step, idx) => {
          const status = getStepStatus(step, idx);

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                {status === "completed" ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal text-white shadow-xs">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 fill-current stroke-2"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                ) : status === "active" ? (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange font-display text-[12px] font-bold text-white shadow-xs">
                    {step.id}
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 font-display text-[12px] font-semibold text-text-3">
                    {step.id}
                  </div>
                )}

                <span
                  className={`mt-1 text-[11px] font-semibold ${
                    status === "active"
                      ? "text-orange"
                      : status === "completed"
                        ? "text-teal"
                        : "text-text-3"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`mx-1.5 h-[2.5px] flex-1 rounded-full ${
                    status === "completed" ? "bg-teal" : "bg-border"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        onClick={() => router.push("/profile/kyc-docs")}
        className="mt-4 w-full rounded-xl bg-orange py-3 font-display text-[14px] font-bold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99]"
      >
        Continue KYC
      </button>
    </div>
  );
}