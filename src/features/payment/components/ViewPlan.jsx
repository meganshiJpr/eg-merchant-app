"use client";

import { useMemo, useState } from "react";
import { inr } from "@/utils/format";

export function ViewPlan({ details, onBack, onSelectPlan }) {
  // Normalize records, categories, and disclaimer from details object
  const { categories, records, disclaimerText } = useMemo(() => {
    let rawRecords = {};
    let rawDisclaimer = "Disclaimer : Plans are subject to change, always verify with operator.";

    if (details) {
      if (details.disclaimer) {
        rawDisclaimer = String(details.disclaimer);
      }

      if (details.records && typeof details.records === "object") {
        rawRecords = details.records;
      } else if (Array.isArray(details)) {
        rawRecords = { "All Packs": details };
      } else if (typeof details === "object") {
        const filteredObj = {};
        Object.entries(details).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            filteredObj[k] = v;
          }
        });
        if (Object.keys(filteredObj).length > 0) {
          rawRecords = filteredObj;
        }
      }
    }

    const cats = Object.keys(rawRecords);
    return {
      categories: cats,
      records: rawRecords,
      disclaimerText: rawDisclaimer,
    };
  }, [details]);

  const [activeTab, setActiveTab] = useState(() => (categories.length > 0 ? categories[0] : ""));

  const currentPlans = useMemo(() => {
    if (!activeTab || !records[activeTab]) {
      if (categories.length > 0) {
        return records[categories[0]] || [];
      }
      return [];
    }
    return records[activeTab] || [];
  }, [activeTab, records, categories]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f5fa] max-w-app mx-auto shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-none items-center gap-3 bg-[#1018ff] px-4 py-3.5 text-white shadow-md">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Payment Details"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 active:scale-95 transition"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden="true">
            <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
          </svg>
        </button>
        <h1 className="font-display text-[16px] font-bold">Plans Details</h1>
      </div>

      {/* Category Tabs Header */}
      {categories.length > 0 && (
        <div className="flex flex-none gap-4 overflow-x-auto no-scrollbar border-b border-border/60 bg-surface px-4 pt-3">
          {categories.map((catName) => {
            const isActive = activeTab === catName || (!activeTab && catName === categories[0]);
            return (
              <button
                key={catName}
                type="button"
                onClick={() => setActiveTab(catName)}
                className={`flex-none pb-2.5 text-[13px] transition-colors ${
                  isActive
                    ? "border-b-2 border-[#1018ff] font-bold text-[#1018ff]"
                    : "font-semibold text-text-3 hover:text-text-1"
                }`}
              >
                {catName}
              </button>
            );
          })}
        </div>
      )}

      {/* Scrollable Plan List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-3 no-scrollbar">
        {currentPlans.length > 0 ? (
          currentPlans.map((p, idx) => {
            const price = Number(p.rs ?? p.amount ?? p.price ?? 0);
            const validityVal = p.validity || p.val || "NA";
            const desc = p.description || p.desc || p.name || "Plan Pack";

            return (
              <div
                key={idx}
                onClick={() => onSelectPlan(p)}
                className="flex cursor-pointer items-center border-b border-border/60 py-7 active:bg-page"
              >
                {/* Amount */}
                <div className="w-[100px] flex-none">
                  <div className="mono text-[25px] font-bold text-text-1">
                    ₹ {inr(price)}
                  </div>
                </div>

                {/* Plan Details */}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-text-1">
                    Validity :
                  </div>

                  <div className="mt-1 text-[15px] font-medium text-text-1">
                    {validityVal}
                  </div>

                  <div className="mt-5 text-[15px] font-medium leading-snug text-text-1">
                    {desc}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-[13px] font-medium text-text-3">
            No plans available for this category
          </div>
        )}
      </div>
    </div>
  );
}
