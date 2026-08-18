"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NumberEntry } from "@/features/recharge/components/NumberEntry";
import { SelectedNumber } from "@/features/recharge/components/SelectedNumber";
import { PlanList } from "@/features/recharge/components/PlanList";
import { useRecharge } from "@/features/recharge/store";
import { fetchRechargeHistory } from "@/features/recharge/api";

export default function RechargePage() {
  const router = useRouter();
  const flow = useRecharge();
  const [rechargeHistory, setRechargeHistory] = useState(null);
  const [stage, setStage] = useState(flow.operator ? "plans" : "entry");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;


    async function getRechargeHistory() {
      try {
        const data = await fetchRechargeHistory();
        console.log("Recharge History Data:", data);
        setRechargeHistory(data);
      } catch (error) {
        console.error("Error fetching recharge history:", error);
      }
    }

    getRechargeHistory();
  }, []);

  function back() {
    if (stage === "plans") {
      flow.reset();
      setStage("entry");
    } else {
      router.push("/");
    }
  }

  const sliderData = rechargeHistory?.sliders;
  const slidePath = sliderData?.slide_path || "";
  const sliders = sliderData?.sliders || [];
  const styles = sliderData?.styles || {};
  const currentSlide = sliders[currentSlideIndex];

  const handleSlideClick = () => {
    if (!currentSlide?.url) return;
    router.push(currentSlide.url);
  };

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

      {/* Dynamic Slider Banner */}
      {currentSlide && (
        <div
          className="group relative mb-4 cursor-pointer overflow-hidden"
          onClick={handleSlideClick}
          style={{
            // margin:`${styles.padding}px`,
          }}
        >
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: `${styles.height}%`,
              // borderRadius: `${styles.cornerRadius}px`,
              borderRadius: `11px`,
            }}
          >
            <img
              src={`${slidePath}${currentSlide.image_url}`}
              alt="Recharge Offer"
              className="h-full w-full object-cover object-top transition-transform duration-300"
            />

            {/* Slide Indicators */}
            {sliders.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {sliders.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlideIndex(idx);
                    }}
                    className={`h-2 w-2 rounded-full transition ${
                      idx === currentSlideIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {stage === "entry" && (
        <NumberEntry
          historyData={rechargeHistory}
          onDetected={() => setStage("plans")}
        />
      )}
      {stage === "plans" && (
        <>
          <SelectedNumber onEdit={back} />
          <PlanList />
        </>
      )}
    </div>
  );
}
