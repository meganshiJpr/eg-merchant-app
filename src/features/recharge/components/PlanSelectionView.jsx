"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRecharge } from "../store";
import { fetchOperatorPlan, fetchPrepaidPlans } from "../api";
import { SelectedNumber } from "./SelectedNumber";
import { Sheet } from "@/components/ui/Sheet";
import { PLANS, inr } from "../data";
import { resolveOperatorCircleInfo } from "../utils/operatorHelper";

const BG_COLORS = ["#E40000", "#7B2CBF", "#0A2885", "#EE2E7B", "#00A896"];

function BenefitAvatar({ item, index }) {
  const title = item?.title || item?.name || "B";
  const initial = title[0].toUpperCase();
  const bg = BG_COLORS[index % BG_COLORS.length];

  if (item?.image_url) {
    const imgPath = item.image_url.startsWith("http")
      ? item.image_url
      : `https://blr1.digitaloceanspaces.com/egpaymentuhfivgruiaslasfmiaronoa/collection/storage/${item.image_url}`;
    return (
      <img
        src={imgPath}
        alt={title}
        className="h-5 w-5 flex-none rounded-lg object-cover shadow-2xs"
        onError={(e) => {
          e.target.style.display = "none";
          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
        }}
      />
    );
  }

  return (
    <span
      className="flex h-7 w-7 flex-none items-center justify-center rounded-lg font-display text-[11px] font-extrabold text-white shadow-2xs"
      style={{ backgroundColor: bg }}
    >
      {initial}
    </span>
  );
}

function HighlightText({ text, query }) {
  if (text === null || text === undefined || text === false) return null;
  const textStr = String(text);
  if (!textStr || textStr === "-") return textStr;
  if (!query || !query.trim()) return textStr;

  const q = query.trim();
  const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = textStr.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-950 px-0.5 rounded-[2px] font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function PlanSelectionView({ onEdit }) {
  const router = useRouter();

  // Stable Zustand selectors
  const num = useRecharge((state) => state.num);
  const name = useRecharge((state) => state.name);
  const operatorPlanData = useRecharge((state) => state.operatorPlanData);
  const operatorPlanSessionId = useRecharge((state) => state.operatorPlanSessionId);
  const flowSet = useRecharge((state) => state.set);

  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(operatorPlanData);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const [activeCat, setActiveCat] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetPlan, setSheetPlan] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPlanDetails() {
      if (!num) return;

      if (operatorPlanData) {
        setPlanData(operatorPlanData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const pData = await fetchOperatorPlan(num).catch(() => null);
        if (!isMounted) return;

        if (pData) {
          setPlanData(pData);
          flowSet({
            operator: pData?.operator,
            circle: pData?.circle || "",
            operatorPlanSessionId: pData.session_id || null,
            operatorPlanData: pData,
          });
        }
      } catch (err) {
        console.error("Error loading operator plan details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPlanDetails();

    return () => {
      isMounted = false;
    };
  }, [num]);

  // Refetch plans via fetchPrepaidPlans ONLY when user completes circle selection in Step 2 Sheet
  async function handleChangeOperatorCircle({ operatorId, circleId, opName, circleName }) {
    try {
      setLoading(true);
      const sessionId = operatorPlanSessionId || operatorPlanData?.session_id || null;

      const pData = await fetchPrepaidPlans({
        operator: operatorId,
        circle: circleId,
        number: num,
        session_id: sessionId,
      }).catch((err) => {
        console.error("fetchPrepaidPlans failed, falling back to fetchOperatorPlan:", err);
        return fetchOperatorPlan(num);
      });

      if (pData) {
        setPlanData(pData);
        const info = resolveOperatorCircleInfo(operatorId || pData.operator, circleId || pData.circle);
        flowSet({
          operator: operatorId || pData.operator,
          operatorName: opName || info.operatorName,
          operatorLogo: info.operatorLogo,
          circle: circleId || pData.circle,
          circleName: circleName || info.circleName,
          operatorPlanSessionId: pData.session_id || sessionId,
          operatorPlanData: pData,
        });
      }
    } catch (err) {
      console.error("Error updating operator and circle plans:", err);
    } finally {
      setLoading(false);
    }
  }

  // Extract Dynamic Categories from Object.keys(records)
  const categories = useMemo(() => {
    if (planData?.records && typeof planData.records === "object") {
      return Object.keys(planData.records);
    }
    return [];
  }, [planData]);

  // Set default selected category to first category key
useEffect(() => {
  if (categories.length > 0) {
    setActiveCat(categories[0]);
  }
}, [categories]); 

  // Extract Top Slider Banner metadata directly from fetchOperatorPlan response
  const sliderData = planData?.sliders;
  const styles = sliderData?.styles || {};
  const slidePath = sliderData?.imageUrl || "https://blr1.digitaloceanspaces.com/egpaymentuhfivgruiaslasfmiaronoa/collection/storage/";
  const slidersList = sliderData?.sliders || [];
  const currentSlide = slidersList[currentSlideIndex];
  const imageSrc = currentSlide?.image ? (currentSlide.image.startsWith("http") ? currentSlide.image : `${slidePath}${currentSlide.image}`) : "";

  const handleSlideClick = () => {
    if (!currentSlide?.redirect_url && !currentSlide?.url) return;
    router.push(currentSlide.redirect_url || currentSlide.url);
  };

  // Filter plans based on category and search query
  const filteredPlans = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      let allPlans = [];
      if (planData?.records) {
        allPlans = Object.values(planData.records).flat();
      } else {
        allPlans = PLANS;
      }
      return allPlans.filter((p) => {
        const priceStr = String(p.rs || p.amt || "");
        const validity = (p.validity || p.val || "").toLowerCase();
        const data = (p.data || "").toLowerCase();
        const voice = (p.voice || p.calls || "").toLowerCase();
        const sms = (p.sms || "").toLowerCase();
        const desc = (p.description || p.desc || "").toLowerCase();
        const badgeText = (p.badge_text || "").toLowerCase();

        const benefitsText = Array.isArray(p.additional_benefits)
          ? p.additional_benefits
              .map((b) => `${b?.title || ""} ${b?.name || ""} ${b?.description || ""}`)
              .join(" ")
              .toLowerCase()
          : "";

        return (
          priceStr.includes(q) ||
          validity.includes(q) ||
          data.includes(q) ||
          voice.includes(q) ||
          sms.includes(q) ||
          desc.includes(q) ||
          badgeText.includes(q) ||
          benefitsText.includes(q)
        );
      });
    }

    if (planData?.records && activeCat) {
      return planData.records[activeCat] || [];
    }

    return PLANS;
  }, [planData, activeCat, searchQuery]);

  function selectPlan(p) {
    if (!p) return;
    const selectedAmt = Number(p.rs || p.amt || 0);
    flowSet({
      mode: "recharge",
      serviceType: "Prepaid",
      plan: p,
      amount: selectedAmt,
      billAmount: selectedAmt,
      paymentDetails: null,
      receipt: null,
    });

    if (sheetPlan) {
      setSheetPlan(null);
    }

    setTimeout(() => {
      router.push("/recharge/receipt");
    }, 50);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 1. DYNAMIC TOP PROMO SLIDER BANNER */}
      {currentSlide && (
        <div
          className="group relative cursor-pointer overflow-hidden transition-all"
          onClick={handleSlideClick}
          style={{
            margin: "0" || `${styles.padding}px`,
          }}
        >
          <div
            className="relative w-full overflow-hidden shadow-xs"
            style={{
              height: styles.height ? `${styles.height}%` : "auto",
              maxHeight: "220px",
              borderRadius: "11px" || `${styles.cornerRadius}px`,
            }}
          >
            <img
              src={imageSrc}
              alt="Recharge Offer Banner"
              className="h-full w-full object-cover object-top transition-transform duration-300"
            />
            {slidersList.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {slidersList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlideIndex(idx);
                    }}
                    className={`h-2 w-2 rounded-full transition-all ${
                      idx === currentSlideIndex ? "w-4 bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SELECTED NUMBER HEADER CARD */}
      <SelectedNumber
        num={num}
        name={name}
        onEdit={onEdit}
        onChangeOperatorCircle={handleChangeOperatorCircle}
      />

      {/* 3. SEARCH PLANS INPUT */}
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-text-3"
        >
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plans (amount, data, OTT, validity...)"
          className="w-full rounded-2xl border border-border bg-surface py-3 pl-10 pr-4 text-[13px] outline-none placeholder:text-text-3 focus:border-primary shadow-xs"
        />
      </div>

      {/* 4. DYNAMIC CATEGORY TABS */}
      {categories.length > 0 && !searchQuery.trim() && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((catName) => {
            const active = activeCat === catName;
            return (
              <button
                key={catName}
                onClick={() => setActiveCat(catName)}
                className={`flex-none rounded-full px-4 py-1.5 text-[12.5px] font-bold transition-all ${
                  active
                    ? "bg-primary-soft border border-primary text-primary shadow-xs"
                    : "border border-border bg-surface text-text-2 hover:bg-page"
                }`}
              >
                {catName}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. PLANS LIST */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-[13px] font-medium text-text-2">Detecting Plans...</span>
          </div>
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map((p, idx) => {
            const price = Number(p.rs || p.amt || 0);
            const val = p.validity || p.val || "-";
            const voice = p.voice || p.calls || "-";
            const data = p.data || "-";
            const sms = p.sms || "-";
            const desc = p.description || p.desc || "";
            const shortDesc = desc
              ? (() => {
                  const words = desc.split("\n")[0].trim().split(/\s+/);
                  return words.length > 4
                    ? words.slice(0, 6).join(" ") + "..."
                    : words.join(" ");
                })()
              : "";
            const perDayCost = p.per_day_cost;
            const benefits = p.additional_benefits || [];
            const badgeText = p.badge_text || "";
            const badgeBg = p.badge_bg_color || "";
            const badgeTextColor = p.badge_text_color || "#ffffff";
            const badgeShimmerColor = p.badge_shimmer_color || "#FFFFFF";

            return (
              <div
                key={idx}
                onClick={() => selectPlan(p)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-xs transition hover:border-primary active:scale-[0.99]"
              >
                {/* Top-Left Corner Badge */}
                {badgeText && (
                  <div
                    className="absolute top-0 left-0 z-10 rounded-tl-2xl rounded-br-xl px-1.5 py-1 text-[7px] font-extrabold uppercase tracking-wide shadow-2xs"
                    style={{
                      backgroundColor: badgeBg,
                      color: badgeTextColor,
                      boxShadow: badgeShimmerColor ? `0 0 8px ${badgeShimmerColor}55` : "none",
                    }}
                  >
                    <HighlightText text={badgeText} query={searchQuery} />
                  </div>
                )}

                {/* Header Row: Rs Price + Per Day Cost + Chevron Arrow Button */}
                <div className={`flex items-center justify-between ${badgeText ? "pt-3" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="mono font-display text-[21px] font-extrabold text-text-1">
                      Rs <HighlightText text={inr(price)} query={searchQuery} />
                    </span>
                    {perDayCost > 0 && (
                      <span className="text-[12px] font-semibold text-text-3">
                        Rs {perDayCost}/day
                      </span>
                    )}
                  </div>

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                      <path d="M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3Z" />
                    </svg>
                  </div>
                </div>

                {/* 4-Column Divided Benefits Grid */}
                <div className="mt-1.5 grid grid-cols-4 divide-x divide-border rounded-xl py-2.5 text-center">
                  <div className="min-w-0 px-1">
                    <div className="flex min-h-[24px] items-start justify-center text-[10px] font-extrabold leading-tight">
                      <HighlightText text={voice} query={searchQuery} />
                    </div>
                    <div className="mt-0.5 text-[10.5px] font-medium text-text-3">
                      Calls
                    </div>
                  </div>

                  <div className="min-w-0 px-1">
                    <div className="flex min-h-[24px] items-start justify-center text-[10px] font-extrabold leading-tight">
                      <HighlightText text={sms} query={searchQuery} />
                    </div>
                    <div className="mt-0.5 text-[10.5px] font-medium text-text-3">
                      SMS
                    </div>
                  </div>

                  <div className="min-w-0 px-1">
                    <div className="flex min-h-[24px] items-start justify-center text-[10px] font-extrabold leading-tight break-words">
                      <HighlightText text={data} query={searchQuery} />
                    </div>
                    <div className="mt-0.5 text-[10.5px] font-medium text-text-3">
                      Data
                    </div>
                  </div>

                  <div className="min-w-0 px-1">
                    <div className="flex min-h-[24px] items-start justify-center text-[10px] font-extrabold leading-tight">
                      <HighlightText text={val} query={searchQuery} />
                    </div>
                    <div className="mt-0.5 text-[10.5px] font-medium text-text-3">
                      Validity
                    </div>
                  </div>
                </div>

                {/* Single-Line Truncated Description */}
                {shortDesc && (
                  <p className="-mt-1 truncate text-[12px] font-medium text-text-2">
                    <HighlightText text={shortDesc} query={searchQuery} />
                  </p>
                )}

                {/* Bottom OTT Minis & "View more" Link */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {benefits.length > 0 && (
                      <div className="flex -space-x-2">
                        {benefits.slice(0, 3).map((b, bIdx) => (
                          <BenefitAvatar key={bIdx} item={b} index={bIdx} />
                        ))}
                      </div>
                    )}
                    {benefits.length > 0 && (
                      <span className="text-[12px] font-bold text-text-3">
                        <HighlightText
                          text={
                            searchQuery.trim()
                              ? benefits.map((b) => b.title || b.name).filter(Boolean).join(", ")
                              : `${benefits.length} benefit${benefits.length > 1 ? "s" : ""}`
                          }
                          query={searchQuery}
                        />
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSheetPlan(p);
                    }}
                    className="flex items-center gap-1 text-[11.5px] font-bold text-primary"
                  >
                    View more
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-primary">
                      <path d="M7 10l5 5 5-5Z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-[12.5px] text-text-3">
            No plans found for the selected filter
          </div>
        )}
      </div>

      {/* 6. PLAN DETAILS SHEET MODAL */}
      <Sheet open={!!sheetPlan} onClose={() => setSheetPlan(null)}>
        {sheetPlan && (
          <div className="flex max-h-[75vh] flex-col overflow-hidden">
            <div className="flex flex-none items-center justify-between pb-3 border-border/40">
              <span className="mono font-display text-[26px] font-extrabold text-text-1">
                Rs <HighlightText text={inr(Number(sheetPlan.rs ?? sheetPlan.amt ?? 0))} query={searchQuery} />
              </span>
              {sheetPlan.per_day_cost > 0 && (
                <span className="rounded-full bg-primary-soft px-3 py-1 text-[12px] font-bold text-primary">
                  Rs {sheetPlan.per_day_cost}/day
                </span>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-3.5 flex flex-col gap-4">
              {/* 4-Column Divided Benefits Grid */}
              <div className="grid grid-cols-4 divide-x divide-border rounded-xl py-2.5 text-center">
                <div className="px-1 min-w-0">
                  <div className="text-[10px] leading-tight break-words min-h-[24px] font-extrabold text-text-1">
                    <HighlightText text={sheetPlan.voice || sheetPlan.calls || "-"} query={searchQuery} />
                  </div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">Calls</div>
                </div>
                <div className="px-1 min-w-0">
                  <div className="break-words min-h-[24px] text-[10px] leading-tight font-extrabold text-text-1">
                    <HighlightText text={sheetPlan.sms || "-"} query={searchQuery} />
                  </div>
                  <div className="mt-0.5 text-[11px] min-h-[24px] break-words leading-tight font-medium text-text-3">SMS</div>
                </div>
                <div className="px-1 min-w-0">
                  <div className="text-[10px] font-extrabold text-text-1 break-words leading-tight min-h-[24px]">
                    <HighlightText text={sheetPlan.data || "-"} query={searchQuery} />
                  </div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">Data</div>
                </div>
                <div className="px-1 min-w-0">
                  <div className="text-[10px] font-extrabold text-text-1 break-words leading-tight min-h-[24px]">
                    <HighlightText text={sheetPlan.validity || sheetPlan.val || "-"} query={searchQuery} />
                  </div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">Validity</div>
                </div>
              </div>

              {/* DESCRIPTION SECTION */}
              {(sheetPlan.description || sheetPlan.desc) && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-3">
                    Description
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-2 whitespace-pre-line">
                    <HighlightText text={sheetPlan.description || sheetPlan.desc} query={searchQuery} />
                  </p>
                </div>
              )}

              {/* ADDITIONAL BENEFITS SECTION */}
              {sheetPlan.additional_benefits && sheetPlan.additional_benefits.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-3">
                    Additional Benefits
                  </div>
                  <div className="mt-2 flex flex-col divide-y divide-border">
                    {sheetPlan.additional_benefits.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <BenefitAvatar item={b} index={bIdx} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-text-1">
                            <HighlightText text={b.title || b.name} query={searchQuery} />
                          </span>
                          {b.description && (
                            <span className="block text-[11.5px] font-medium text-text-3">
                              <HighlightText text={b.description} query={searchQuery} />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FULL-WIDTH BLUE ACTION BUTTON */}
            <div className="flex-none pt-2.5 bg-surface border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  const p = sheetPlan;
                  selectPlan(p);
                }}
                className="w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[14px] font-bold text-white shadow-xs active:scale-[0.985] transition"
              >
                Select This Plan
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
