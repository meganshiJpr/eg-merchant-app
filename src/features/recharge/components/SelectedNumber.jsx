"use client";

import { useState, useEffect, useMemo } from "react";
import { useRecharge } from "../store";
import { Sheet } from "@/components/ui/Sheet";

function getSessionOperatorsData() {
  if (typeof window === "undefined") return null;
  try {
    const cached = sessionStorage.getItem("contractor_list_session");
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn("Could not read contractor_list_session from sessionStorage:", err);
    return null;
  }
}

export function SelectedNumber({ num, name, onEdit, onChangeOperatorCircle }) {
  const flow = useRecharge();
  const targetNum = num || flow.num || "-";

  const [opState, setOpState] = useState({
    name: "-",
    circle: "-",
    type: "-",
    logo: null,
  });

  // 2-Step Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = Select operator, 2 = Select circle
  const [selectedOp, setSelectedOp] = useState(null);
  const [selectedCircle, setSelectedCircle] = useState(null);

  const sessionData = useMemo(() => getSessionOperatorsData(), []);

  // Filter Prepaid Operators ONLY from session contractor_list_session
  const prepaidOps = useMemo(() => {
    const allOps =
      sessionData?.operators?.all ||
      sessionData?.data?.operators?.all ||
      sessionData?.operators ||
      sessionData?.data?.operators;

    const rawOps = Array.isArray(allOps)
      ? allOps
      : allOps && typeof allOps === "object"
        ? Object.values(allOps)
        : Array.isArray(sessionData)
          ? sessionData
          : [];

    return rawOps.filter((op) => !op.type || op.type === "Prepaid");
  }, [sessionData]);

  // Circles list from session
  const rawCircles = useMemo(() => {
    return sessionData?.circles || sessionData?.operators?.circles || sessionData?.states || [];
  }, [sessionData]);

  const basePath = sessionData?.operator_img || "https://staging.paybyapis.com/images/operators/";

  useEffect(() => {
    function loadOperatorDetails() {
      if (!targetNum) return;
      const apiOpId = flow.operator ? String(flow.operator) : flow.operatorPlanData?.operator ? String(flow.operatorPlanData.operator) : null;
      const apiCircleId = flow.circle ? String(flow.circle) : flow.operatorPlanData?.circle ? String(flow.operatorPlanData.circle) : null;

      let matchedName = "-";
      let matchedType = "-";
      let matchedLogo = null;

      if (Array.isArray(prepaidOps) && apiOpId) {
        const foundOp = prepaidOps.find((o) => String(o.id) === apiOpId);
        if (foundOp) {
          matchedName = foundOp.name || "-";
          matchedType = foundOp.type || "Prepaid";
          if (foundOp.logo) {
            matchedLogo = foundOp.logo.startsWith("http") ? foundOp.logo : `${basePath}${foundOp.logo}`;
          }
          setSelectedOp(foundOp);
        }
      }

      let matchedCircleName = "-";
      if (Array.isArray(rawCircles) && apiCircleId) {
        const foundState = rawCircles.find(
          (s) => String(s.id) === apiCircleId || String(s.state_name).toLowerCase() === String(apiCircleId).toLowerCase()
        );
        if (foundState) {
          matchedCircleName = foundState.state_name || "-";
          setSelectedCircle(foundState);
        } else if (typeof flow.circle === "string" && flow.circle) {
          matchedCircleName = flow.circle;
        }
      } else if (typeof flow.circle === "string" && flow.circle) {
        matchedCircleName = flow.circle;
      }

      setOpState({
        name: matchedName !== "-" ? matchedName : flow.operator || "-",
        circle: matchedCircleName,
        type: matchedType !== "-" ? matchedType : "Prepaid",
        logo: matchedLogo,
      });
    }

    loadOperatorDetails();
  }, [targetNum, flow.operator, flow.circle, flow.operatorPlanData, prepaidOps, rawCircles, basePath]);

  const opName = opState.name;
  const stateName = opState.circle;
  const opType = opState.type;
  const logo = opState.logo;

  function openSelectorSheet() {
    setStep(1);
    setSheetOpen(true);
  }

  function handleSelectOp(op) {
    setSelectedOp(op);
    setStep(2);
  }

  function handleSelectCircle(circleObj) {
    setSelectedCircle(circleObj);
    setSheetOpen(false);

    if (onChangeOperatorCircle && selectedOp) {
      onChangeOperatorCircle({
        operatorId: selectedOp.id,
        circleId: circleObj.id || circleObj.state_name,
        opName: selectedOp.name,
        circleName: circleObj.state_name,
      });
    }
  }

  return (
    <>
      <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary bg-surface p-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Operator Logo Avatar */}
          {logo ? (
            <img
              src={logo}
              alt={opName}
              className="h-10 w-10 flex-none rounded-full border border-border bg-page object-cover shadow-xs"
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <span
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-border/50 text-[11px] font-bold text-text-2 shadow-xs"
            style={{ display: logo ? "none" : "flex" }}
          >
            {opName !== "-" ? opName.slice(0, 2).toUpperCase() : "-"}
          </span>

          <div className="min-w-0 flex-1">
            {/* Title Row: Number + Edit Icon */}
            <div className="flex items-center gap-1.5 font-display text-[14px] font-bold text-[#5b5f73]">
              <span className="mono tracking-tight">{targetNum}</span>
              <button
                onClick={onEdit}
                aria-label="Edit number"
                className="ml-0.5 text-primary hover:text-primary-dark active:scale-90 transition"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </button>
            </div>

            {/* Subtitle Row: Operator • Circle • Type */}
            <div className="text-[12px] text-text-3">
              {opName} • {stateName} 
            </div>
          </div>
        </div>

        {/* Right Action Button: Change */}
        <button
          onClick={openSelectorSheet}
          className="flex-none rounded-full border border-primary bg-primary-soft px-3.5 py-1 text-[12.5px] font-bold text-primary active:scale-95 transition cursor-pointer"
        >
          Change
        </button>
      </div>

      {/* 2-Step Operator & Circle Bottom Sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {step === 1 ? (
          /* STEP 1: SELECT OPERATOR (Prepaid Only from session) */
          <div className="flex flex-col gap-4 py-2">
            <h2 className="font-display text-[16px] font-bold text-text-1">Select operator</h2>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {prepaidOps.map((op) => {
                const isSelected = String(selectedOp?.id) === String(op.id);
                const opLogoUrl = op.logo
                  ? op.logo.startsWith("http")
                    ? op.logo
                    : `${basePath}${op.logo}`
                  : null;

                return (
                  <button
                    key={op.id}
                    onClick={() => handleSelectOp(op)}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3 text-left shadow-2xs transition active:scale-[0.985]"
                  >
                    <div className="flex items-center gap-3.5">
                      {opLogoUrl ? (
                        <img
                          src={opLogoUrl}
                          alt={op.name}
                          className="h-9 w-9 flex-none rounded-full border border-border bg-page object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <span
                        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary font-display text-[12px] font-bold text-white shadow-2xs"
                        style={{ display: opLogoUrl ? "none" : "flex" }}
                      >
                        {op.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="font-display text-[14px] font-bold text-text-1">{op.name}</span>
                    </div>

                    {/* Radio Button Selector */}
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                        isSelected ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP 2: SELECT CIRCLE */
          <div className="flex flex-col gap-4 py-2">
            <div>
              <h2 className="font-display text-[16px] font-bold text-text-1">Select circle</h2>
              {/* Back link to change operator */}
              <button
                onClick={() => setStep(1)}
                className="mt-1 flex items-center gap-1 text-[12.5px] font-semibold text-primary"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-primary">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
                {selectedOp?.name || "Operator"} selected · change
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto no-scrollbar">
              {rawCircles.map((circleObj, cIdx) => {
                const isSelected =
                  String(selectedCircle?.id) === String(circleObj.id) ||
                  String(selectedCircle?.state_name).toLowerCase() === String(circleObj.state_name).toLowerCase();
                const initialLetter = (circleObj.state_name || "S")[0].toUpperCase();

                return (
                  <button
                    key={circleObj.id || cIdx}
                    onClick={() => handleSelectCircle(circleObj)}
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3 text-left shadow-2xs transition active:scale-[0.985]"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-50 font-display text-[13px] font-bold text-primary">
                        {initialLetter}
                      </span>
                      <span className="font-display text-[14px] font-bold text-text-1">
                        {circleObj.state_name}
                      </span>
                    </div>

                    {/* Radio Button Selector */}
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                        isSelected ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
