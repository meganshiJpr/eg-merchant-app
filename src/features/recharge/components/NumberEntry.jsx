"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { getMerchantMobile, formatRechargeDate, STATIC_CONTACTS } from "../data";
import { useRecharge } from "../store";
import { fetchOperatorsList } from "@/features/dashboard/api";
import { fetchRechargeHistory, fetchOperatorPlan, fetchPrepaidPlans } from "../api";
import { Sheet } from "@/components/ui/Sheet";
import { resolveOperatorCircleInfo } from "../utils/operatorHelper";

function initials(name) {
  if (!name) return "EG";
  const p = name.trim().split(/\s+/);
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}

function clean10(num) {
  return String(num || "").replace(/\D/g, "").slice(-10);
}

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

export function NumberEntry({ historyData, onDetected }) {
  const setFlow = useRecharge((state) => state.set);
  const [value, setValue] = useState("");

  // Merchant mobile from session / cookie
  const [merchantMobile, setMerchantMobile] = useState("9926452120");
  const [myNumberSubtitle, setMyNumberSubtitle] = useState("");

  // Dynamic recent recharges mapped & deduplicated from historyData
  const [recentList, setRecentList] = useState([]);

  // Auto-detection states for 10-digit entry
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");

  // Pre-redirect operator & circle sheet selection states (when operator == 0 or circle == 0)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedOp, setSelectedOp] = useState(null);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [pendingInfo, setPendingInfo] = useState(null);

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

    const hasFetchedRef = useRef(false);

  useEffect(() => {
   if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const mob = getMerchantMobile();
    if (mob) setMerchantMobile(mob);

    async function processHistory() {
      try {
        const [opData, historyRes] = await Promise.all([
          fetchOperatorsList().catch((err) => {
            console.error("fetchOperatorsList failed in NumberEntry:", err);
            return null;
          }),
          historyData
            ? Promise.resolve(historyData)
            : fetchRechargeHistory().catch((err) => {
                console.error("fetchRechargeHistory failed in NumberEntry:", err);
                return null;
              }),
        ]);

        const hData = historyData || historyRes || {};
        const map = {};
        const allOps =
          opData?.operators?.all ||
          opData?.data?.operators?.all ||
          opData?.operators ||
          opData?.data?.operators ||
          opData;

        const rawOps = Array.isArray(allOps)
          ? allOps
          : allOps && typeof allOps === "object"
            ? Object.values(allOps)
            : [];

        if (Array.isArray(rawOps)) {
          const logoPath =
            opData?.operator_img ||
            opData?.data?.operator_img ||
            "https://staging.paybyapis.com/images/operators/";

          rawOps.forEach((op) => {
            if (!op) return;
            if (op.type === "Prepaid" || !op.type) {
              map[String(op.id)] = {
                name: op.name,
                logo: op.logo
                  ? op.logo.startsWith("http")
                    ? op.logo
                    : `${logoPath}${op.logo}`
                  : null,
              };
            }
          });
        }

        const unfinished = hData?.unfinished || [];
        const finished = hData?.finished || [];

        const targetMerchantClean = clean10(mob || merchantMobile);
        let extractedMySub = "";
        const numberMap = new Map();

        unfinished.forEach((item) => {
          if (!item || !item.number) return;
          const cleanNum = clean10(item.number);
          const opInfo = map[String(item.operator)];
          const dateVal = Number(item.date || 0);

          const subtitleText = item?.msg
            ? item.msg.replace(/^Continue payment of ₹\d+/i, "Continue payment")
            : "Continue payment";

          if (cleanNum && cleanNum === targetMerchantClean) {
            extractedMySub = subtitleText;
            return;
          }

          const entry = {
            num: String(item.number),
            cleanNum,
            name: opInfo?.name || "Prepaid",
            logo: opInfo?.logo || null,
            subtitle: subtitleText,
            date: dateVal,
            tag: "recent",
            color: "#EE2E7B",
            isUnfinished: true,
          };

          const existing = numberMap.get(cleanNum);
          if (!existing || dateVal >= existing.date) {
            numberMap.set(cleanNum, entry);
          }
        });

        finished.forEach((item) => {
          if (!item || !item.number) return;
          const cleanNum = clean10(item.number);
          const opInfo = map[String(item.operator)];
          const dateStr = formatRechargeDate(item.date);
          const dateVal = Number(item.date || 0);

          const subtitleText = `Last recharge of ₹${item.amount || "0"}${dateStr ? ` on ${dateStr}` : ""}`;

          if (cleanNum && cleanNum === targetMerchantClean) {
            if (!extractedMySub) extractedMySub = subtitleText;
            return;
          }

          const entry = {
            num: String(item.number),
            cleanNum,
            name: opInfo?.name || "Prepaid",
            logo: opInfo?.logo || null,
            subtitle: subtitleText,
            date: dateVal,
            tag: "recent",
            color: "#0A2885",
            isUnfinished: false,
          };

          const existing = numberMap.get(cleanNum);
          if (!existing || (!existing.isUnfinished && dateVal > existing.date)) {
            numberMap.set(cleanNum, entry);
          }
        });

        setMyNumberSubtitle(extractedMySub);
        setRecentList(Array.from(numberMap.values()));
      } catch (err) {
        console.error("Error processing recharge entry history data:", err);
      }
    }

    processHistory();
  }, [historyData, merchantMobile]);

  const cleanDigits = useMemo(() => value.replace(/\D/g, ""), [value]);

  const filteredMyNumber = useMemo(() => {
    const q = value.trim().toLowerCase();
    const cleanMerchant = clean10(merchantMobile);
    if (!q || "my number".includes(q) || cleanMerchant.includes(q)) {
      return [
        {
          name: "My Number",
          num: merchantMobile,
          subtitle: myNumberSubtitle,
          tag: "self",
          color: "var(--primary)",
        },
      ];
    }
    return [];
  }, [value, merchantMobile, myNumberSubtitle]);

  const filteredRecents = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return recentList;
    return recentList.filter((s) => s.num.includes(q) || s.name.toLowerCase().includes(q));
  }, [value, recentList]);

  const filteredContacts = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return STATIC_CONTACTS;
    return STATIC_CONTACTS.filter((s) => s.num.includes(q) || s.name.toLowerCase().includes(q));
  }, [value]);

  const totalMatches = filteredMyNumber.length + filteredRecents.length + filteredContacts.length;
  const hasNoMatch = cleanDigits.length > 0 && cleanDigits.length < 10 && totalMatches === 0;
  const isDetectingOrComplete = cleanDigits.length >= 10;

  // Auto-detect operator & plans on 10-digit completion
  useEffect(() => {
    let isMounted = true;
    if (cleanDigits.length === 10) {
      setDetecting(true);
      setDetectError("");

      async function autoDetect() {
        try {
          const pData = await fetchOperatorPlan(cleanDigits).catch(() => null);
          if (!isMounted) return;

          if (pData) {
            const isOpZero = !pData.operator || String(pData.operator) === "0";
            const isCircleZero = !pData.circle || String(pData.circle) === "0";

            if (isOpZero || isCircleZero) {
              // Stay on /recharge and open 2-step sheet before redirecting!
              setPendingInfo({
                num: cleanDigits,
                sessionId: pData.session_id || null,
              });
              setStep(1);
              setSelectedOp(null);
              setSelectedCircle(null);
              setSheetOpen(true);
              setDetecting(false);
            } else {
              const info = resolveOperatorCircleInfo(pData.operator, pData.circle);
              useRecharge.getState().reset();

              setFlow({
                mode: "recharge",
                serviceType: "Prepaid",
                num: cleanDigits,
                name: null,
                operator: pData.operator,
                operatorName: info.operatorName,
                operatorLogo: info.operatorLogo,
                circle: pData.circle || "14",
                circleName: info.circleName,
                session_id: pData.session_id || null,
                operatorPlanSessionId: pData.session_id || null,
                operatorPlanData: pData,
                plan: null,
                customAmt: null,
              });
              onDetected();
            }
          } else {
            setDetectError("Invalid mobile number or operator not found");
          }
        } catch (err) {
          if (isMounted) setDetectError("Invalid mobile number or operator not found");
        } finally {
          if (isMounted) setDetecting(false);
        }
      }

      autoDetect();
    } else {
      setDetecting(false);
      setDetectError("");
    }

    return () => {
      isMounted = false;
    };
  }, [cleanDigits, setFlow, onDetected]);

  function onInput(v) {
    const clean = v.replace(/[^0-9a-zA-Z ]/g, "");
    setValue(clean);
  }

  function pick(s) {
    setValue(s.num);
  }

  function handleSelectOp(op) {
    setSelectedOp(op);
    setStep(2);
  }

  async function handleSelectCircle(circleObj) {
    setSelectedCircle(circleObj);
    setSheetOpen(false);

    if (pendingInfo && selectedOp) {
      try {
        setDetecting(true);
        const pData = await fetchPrepaidPlans({
          operator: selectedOp.id,
          circle: circleObj.id || circleObj.state_name,
          number: pendingInfo.num,
          session_id: pendingInfo.sessionId,
        }).catch((err) => {
          console.error("fetchPrepaidPlans failed after manual selection:", err);
          return null;
        });

        if (pData) {
          const info = resolveOperatorCircleInfo(selectedOp.id, circleObj.id || circleObj.state_name);
          useRecharge.getState().reset();

          setFlow({
            mode: "recharge",
            serviceType: "Prepaid",
            num: pendingInfo.num,
            name: null,
            operator: selectedOp.id,
            operatorName: info.operatorName || selectedOp.name,
            operatorLogo: info.operatorLogo,
            circle: circleObj.id || circleObj.state_name,
            circleName: circleObj.state_name || info.circleName,
            session_id: pData.session_id || pendingInfo.sessionId,
            operatorPlanSessionId: pData.session_id || pendingInfo.sessionId,
            operatorPlanData: pData,
            plan: null,
            customAmt: null,
          });
          onDetected();
        } else {
          setDetectError("Unable to fetch plans for selected operator and circle");
        }
      } catch (err) {
        setDetectError("Unable to fetch plans for selected operator and circle");
      } finally {
        setDetecting(false);
      }
    }
  }

  const isOverflow = cleanDigits.length > 10;

  return (
    <div>
      {/* Searchbar Input */}
      <div className="mb-2.5 text-[12.5px] font-semibold text-text-2">Customer mobile number</div>
      <div className="flex items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 focus-within:border-primary">
        <span className="mono text-[14px] font-medium text-text-3">+91</span>
        <input
          value={value}
          onChange={(e) => onInput(e.target.value)}
          inputMode="numeric"
          maxLength={11}
          placeholder="Search name or enter number"
          className="mono min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:font-body placeholder:text-text-3"
        />
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-text-3">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
        </svg>
      </div>

      {detecting  || isDetectingOrComplete ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-[13px] font-medium text-text-2">Detecting operator and circle...</span>
        </div>
      ) : detectError ? (
        <div className="mt-4 text-center text-[12.5px] font-semibold text-rose-500">
          {detectError}
        </div>
      ) : isOverflow ? (
        <div className="mt-6 text-center text-[13px] font-semibold text-text-3">
          No contact found
        </div>
      ) : hasNoMatch ? (
        <div className="mt-12 text-center text-[13px] font-medium text-text-3">
          No match in your list — keep typing the full number
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {/* 1. MY NUMBER SECTION */}
          {filteredMyNumber.length > 0 && (
            <div>
              {filteredMyNumber.map((s) => (
                <div
                  key={s.num}
                  onClick={() => pick(s)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2 text-left shadow-xs transition active:scale-[0.985]"
                >
                  <div
                    className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[13px] font-bold text-white shadow-xs"
                    style={{ background: "linear-gradient(135deg, #F07800 0%, #E40000 100%)" }}
                  >
                    MN
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-text-1">{s.name}</span>
                    <span className="mono block text-[12px] font-medium text-text-2">{s.num}</span>
                    {s.subtitle && (
                      <span className="block text-[11.5px] font-semibold text-primary">{s.subtitle}</span>
                    )}
                  </div>
                  <span className="flex-none rounded-full bg-primary-soft px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                    SELF
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 2. RECENT RECHARGES SECTION */}
          {filteredRecents.length > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-display text-[13px] font-bold text-text-1">Recent Recharges</span>
                <button className="text-[12px] font-bold text-primary">View all</button>
              </div>

              <div className="flex flex-col gap-2">
                {filteredRecents.map((s, idx) => (
                  <button
                    key={`${s.num}-${idx}`}
                    onClick={() => pick(s)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-3.5 h-16 text-left shadow-xs transition active:scale-[0.985]"
                  >
                    {s.logo ? (
                      <img
                        src={s.logo}
                        alt={s.name}
                        className="h-10 w-10 flex-none rounded-full border border-border bg-page object-cover shadow-xs"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <span
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[12px] font-bold text-white shadow-xs"
                      style={{
                        background: s.color || "#EE2E7B",
                        display: s.logo ? "none" : "flex",
                      }}
                    >
                      {initials(s.name)}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-text-1">{s.name}</span>
                      <span className="mono block text-[12px] font-medium text-text-2">{s.num}</span>
                      {s.subtitle && (
                        <span
                          className={`block text-[11.5px] font-medium ${
                            s.subtitle.startsWith("Continue") ? "font-semibold text-primary" : "text-text-3"
                          }`}
                        >
                          {s.subtitle}
                        </span>
                      )}
                    </span>

                    <span className="flex-none rounded-full bg-teal-soft px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-teal">
                      RECENT
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. ALL CONTACTS SECTION */}
          {filteredContacts.length > 0 && (
            <div>
              <div className="mb-2 px-1 font-display text-[13px] font-bold text-text-1">All Contact</div>

              <div className="flex flex-col gap-2">
                {filteredContacts.map((s, idx) => (
                  <button
                    key={`${s.num}-${idx}`}
                    onClick={() => pick(s)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left shadow-xs transition active:scale-[0.985]"
                  >
                    <span
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[12px] font-bold text-white shadow-xs"
                      style={{
                        background: s.name.startsWith("+91")
                          ? "linear-gradient(135deg, #F07800 0%, #E40000 100%)"
                          : s.color || "var(--primary)",
                      }}
                    >
                      {s.name.startsWith("+91") ? (
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" />
                        </svg>
                      ) : (
                        initials(s.name)
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-text-1">{s.name}</span>
                      <span className="mono block text-[12px] font-medium text-text-3">{s.num}</span>
                    </span>

                    <span className="flex-none rounded-full border border-border bg-page px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-text-3">
                      CONTACT
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pre-redirect 2-Step Operator & Circle Selection Sheet */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        {step === 1 ? (
          /* STEP 1: SELECT OPERATOR */
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
    </div>
  );
}
