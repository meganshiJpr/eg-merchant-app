"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BILLERS } from "../data";
import { useBill } from "../store";
import { SearchInput } from "@/components/ui/SearchInput";
import { fetchRechargeHistory, fetchBillerinfo, fetchOperatorBillInfo } from "@/features/recharge/api";
import { formatRechargeDate } from "@/features/recharge/data";
import { useRecharge } from "@/features/recharge/store";
import { useToast } from "@/components/ui/Toast";

function getOperatorsByTypeFromSession(categoryType) {
  if (typeof window === "undefined") return [];
  try {
    const cached = sessionStorage.getItem("contractor_list_session");
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    const allOps = parsed?.operators?.all || {};
    const states = parsed?.states || parsed?.data?.states || [];
    const basePath =
      parsed?.operator_img ||
      parsed?.data?.operator_img ||
      "https://staging.paybyapis.com/images/operators/";

    const targetType = String(categoryType || "DTH").toUpperCase();
    const result = [];

    for (const key in allOps) {
      const op = allOps[key];

      if (String(op?.type).toUpperCase() !== targetType) continue;

      result.push(op);
    }

    return result.map((op) => {
      const matchedState = states.find(
        (state) => String(state.id) === String(op.state_id)
      );

      const logoUrl = op.logo
        ? op.logo.startsWith("http")
          ? op.logo
          : `${basePath}${op.logo}`
        : null;

      let numData = null;
      if (op.number_data) {
        try {
          numData = typeof op.number_data === "string" ? JSON.parse(op.number_data) : op.number_data;
        } catch {}
      }

      const fieldLabel = numData?.numberText || "Subscriber ID / Account Number";
      const fieldPh = numData?.eg || `Enter ${fieldLabel}`;
      const minLen = numData?.minLength ? Number(numData.minLength) : 8;
      const maxLen = numData?.maxLength ? Number(numData.maxLength) : 12;
      const inputType = numData?.numberType === "numeric" ? "num" : "txt";

      return {
        id: String(op.id),
        n: op.name,
        sub: matchedState?.name || "",
        logo: logoUrl,
        a: op.name ? op.name.slice(0, 2).toUpperCase() : targetType.slice(0, 2),
        c: "#3B0764",
        btn: targetType === "DTH" ? "info" : "fetch",
        numberData: numData,
        fields: [{ label: fieldLabel, type: inputType, ph: fieldPh, min: minLen, max: maxLen }],
      };
    });
  } catch (err) {
    console.warn("Could not read operators from contractor_list_session:", err);
    return [];
  }
}

export function BillerList({ categoryType = "DTH", catIndex = 0 }) {
  const router = useRouter();
  const toast = useToast((t) => t.show);
  const [q, setQ] = useState("");
  const [recentHistory, setRecentHistory] = useState([]);
  const [loadingHistoryIdx, setLoadingHistoryIdx] = useState(null);

  const cat = BILLERS[catIndex] || BILLERS[0];
  const typeKey = categoryType || "DTH";
  
  // 1. Load Recent Recharges for this category (e.g. type="DTH")
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const hData = await fetchRechargeHistory(typeKey).catch(() => null);
        if (!isMounted || !hData) return;
        console.log("dth respone last recharge history",hData)

        const sessionOps = getOperatorsByTypeFromSession(typeKey);
        const opMap = new Map();
        sessionOps.forEach((op) => opMap.set(String(op.id), op));

        const unfinished = hData?.unfinished || [];
        const finished = hData?.finished || [];

        const historyMap = new Map();

        unfinished.forEach((item) => {
          if (!item || !item.number) return;

          const opId = String(item.operator || "").trim();
          const numKey = String(item.number || "").trim();
          const compositeKey = `${opId}_${numKey}`;
          const dateVal = Number(item.date || 0);
          const matchedOp = opMap.get(opId);
          const subtitleText = item?.msg
            ? item.msg.replace(/^Continue payment of ₹\d+/i, "Continue payment")
            : "Continue payment";

          const entry = {
            num: numKey,
            opId: opId,
            name: matchedOp?.n || item.operator_name || `${typeKey} Account`,
            logo: matchedOp?.logo || null,
            subtitle: item?.msg ? `${item.msg}` : subtitleText,
            date: dateVal,
            isUnfinished: true,
            field1: item.field1 ? String(item.field1).trim() : "",
            field2: item.field2 ? String(item.field2).trim() : "",
            field3: item.field3 ? String(item.field3).trim() : "",
            field4: item.field4 ? String(item.field4).trim() : "",
            amount: Number(item.amount || item.billAmount || 0),
            billAmount: Number(item.billAmount || item.amount || 0),
            session_id: item.session_id || null,
            billdata: item.billdata || null,
            custName: item.custName || item?.billdata?.["Customer Name"] || null,
            slabs: Array.isArray(item.slabs) ? item.slabs : [],
            details: item.details || item.records || null,
          };

          const existing = historyMap.get(compositeKey);
          if (!existing || dateVal >= existing.date) {
            historyMap.set(compositeKey, entry);
          }
        });

        finished.forEach((item) => {
          if (!item || !item.number) return;

          const opId = String(item.operator || "").trim();
          const numKey = String(item.number || "").trim();
          const compositeKey = `${opId}_${numKey}`;
          const dateVal = Number(item.date || 0);
          const matchedOp = opMap.get(opId);
          const dateStr = formatRechargeDate(item.date);
          const subtitleText = `Last recharge of ₹${item.amount || "0"}${dateStr ? ` on ${dateStr}` : ""}`;

          const entry = {
            num: numKey,
            opId: opId,
            name: matchedOp?.n || item.operator_name || `${typeKey} Account`,
            logo: matchedOp?.logo || null,
            subtitle: subtitleText,
            date: dateVal,
            isUnfinished: false,
            field1: item.field1 ? String(item.field1).trim() : "",
            field2: item.field2 ? String(item.field2).trim() : "",
            field3: item.field3 ? String(item.field3).trim() : "",
            field4: item.field4 ? String(item.field4).trim() : "",
            amount: Number(item.amount || item.billAmount || 0),
            billAmount: Number(item.billAmount || item.amount || 0),
            session_id: item.session_id || null,
            billdata: item.billdata || null,
            custName: item.custName || item?.billdata?.["Customer Name"] || null,
            slabs: Array.isArray(item.slabs) ? item.slabs : [],
            details: item.details || item.records || null,
          };

          const existing = historyMap.get(compositeKey);
          if (!existing || (!existing.isUnfinished && dateVal > existing.date) || (existing.isUnfinished && dateVal > existing.date)) {
            historyMap.set(compositeKey, entry);
          }
        });

        const sortedDeduplicated = Array.from(historyMap.values()).sort((a, b) => b.date - a.date);

        if (isMounted) setRecentHistory(sortedDeduplicated.slice(0, 5));
      } catch (err) {
        console.error("Error loading recent recharge history:", err);
      }
    }

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [typeKey]);

  // 2. Load dynamic operators from session storage
  const sessionItems = useMemo(() => {
    return getOperatorsByTypeFromSession(typeKey);
  }, [typeKey]);

  const rawItems = useMemo(() => {
    if (sessionItems.length > 0) return sessionItems;
    return Array.isArray(cat?.items) ? cat.items : [];
  }, [sessionItems, cat]);

  const filteredRecents = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return recentHistory;
    return recentHistory.filter(
      (r) => r.num.toLowerCase().includes(needle) || r.name.toLowerCase().includes(needle)
    );
  }, [q, recentHistory]);

  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rawItems.filter((b) => !needle || `${b.n} ${b.sub}`.toLowerCase().includes(needle));
  }, [q, rawItems]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Search Input */}
      <div>
        <SearchInput value={q} onChange={setQ} placeholder="Search operator" />
      </div>

      {/* RECENT RECHARGES CARD SECTION (If available) */}
      {filteredRecents.length > 0 && (
        <div>
          <div className="mb-2 px-1 font-display text-[13px] font-bold text-text-1">
            Recent {typeKey} Recharges
          </div>

          <div className="flex flex-col gap-2">
            {filteredRecents.map((r, idx) => (
              <button
                key={`${r.num}-${idx}`}
                disabled={loadingHistoryIdx !== null}
                onClick={async () => {
                  if (loadingHistoryIdx !== null) return;

                  const matchedOp = sessionItems.find((op) => String(op.id) === String(r.opId));
                  let allRequiredFieldsPresent = Boolean(r.num && String(r.num).trim());

                  if (matchedOp?.numberData) {
                    const nd = matchedOp.numberData;
                    if (nd.field1_data && nd.field1_data.is_optional === false && !r.field1) allRequiredFieldsPresent = false;
                    if (nd.field2_data && nd.field2_data.is_optional === false && !r.field2) allRequiredFieldsPresent = false;
                    if (nd.field3_data && nd.field3_data.is_optional === false && !r.field3) allRequiredFieldsPresent = false;
                    if (nd.field4_data && nd.field4_data.is_optional === false && !r.field4) allRequiredFieldsPresent = false;
                  }

                  useBill.getState().reset();

                  if (!allRequiredFieldsPresent) {
                    useRecharge.getState().set({
                      mode: "bill",
                      serviceType: typeKey,
                      operator: String(r.opId),
                      operatorName: r.name,
                      operatorLogo: r.logo || null,
                      num: String(r.num),
                      field1: r.field1 || "",
                      field2: r.field2 || "",
                      field3: r.field3 || "",
                      field4: r.field4 || "",
                      session_id: null,
                      billdata: null,
                      custName: null,
                      amount: 0,
                      billAmount: 0,
                      paymentDetails: null,
                      details: null,
                      slabs: [],
                      receipt: null,
                      fromHistory: true,
                    });
                    router.push(`/billers/form?type=${typeKey}&operator=${r.opId}&number=${r.num}`);
                    return;
                  }

                  setLoadingHistoryIdx(idx);
                  try {
                    let infoRes = null;
                    const isDTH = String(typeKey).toUpperCase() === "DTH" || String(r.type).toUpperCase() === "DTH";

                    if (isDTH) {
                      infoRes = await fetchBillerinfo({
                        operator: String(r.opId),
                        number: String(r.num),
                      }).catch((err) => {
                        console.warn("Direct history fetchBillerinfo error:", err);
                        return null;
                      });
                    } else {
                      const reqPayload = {
                        number: String(r.num || "").trim(),
                        operator: String(r.opId || "").trim(),
                        type: String(typeKey || r.type || "Electricity").trim(),
                        field1: String(r.field1 || "").trim(),
                        field2: String(r.field2 || "").trim(),
                        field3: String(r.field3 || "").trim(),
                        field4: String(r.field4 || "").trim(),
                      };
                      console.log("Direct history calling fetchOperatorBillInfo:", reqPayload);
                      infoRes = await fetchOperatorBillInfo(reqPayload).catch((err) => {
                        console.warn("Direct history fetchOperatorBillInfo error:", err);
                        return null;
                      });
                    }

                    if (!isDTH && infoRes && (infoRes.success === 0 || infoRes.success === "0")) {
                      const msg = infoRes.message || "Payment received for the billing period - no bill due";
                      toast(msg);
                      setLoadingHistoryIdx(null);
                      return;
                    }

                    const returnedAmt = infoRes?.billAmount !== undefined ? Number(infoRes.billAmount) : Number(infoRes?.amount ?? 0);
                    const billdata = infoRes?.billdata || (infoRes?.message ? { Message: infoRes.message } : {});
                    const custName = billdata["Customer Name"] || infoRes?.custName || r.custName || null;
                    const session_id = infoRes?.session_id || null;
                    const slabs = Array.isArray(infoRes?.slabs) ? infoRes.slabs : [];
                    const planDetails = infoRes?.details || infoRes?.records || null;
                    const isEditable = infoRes?.amountEditable !== false;

                    useRecharge.getState().set({
                      mode: "bill",
                      serviceType: typeKey,
                      num: String(r.num),
                      field1: String(r.field1 || ""),
                      field2: String(r.field2 || ""),
                      field3: String(r.field3 || ""),
                      field4: String(r.field4 || ""),
                      operator: String(r.opId),
                      operatorName: r.name,
                      operatorLogo: r.logo || null,
                      circle: "14",
                      circleName: "Rajasthan",
                      session_id: session_id,
                      operatorPlanSessionId: session_id,
                      billdata: billdata,
                      slabs: slabs,
                      billAmount: returnedAmt,
                      amount: returnedAmt,
                      custName: custName,
                      details: planDetails,
                      amountEditable: isEditable,
                      paymentDetails: null,
                      fromHistory: true,
                    });

                    router.push("/billers/pay");
                  } catch (err) {
                    console.error("Direct history flow error:", err);
                    router.push(`/billers/form?type=${typeKey}&operator=${r.opId}&number=${r.num}`);
                  } finally {
                    setLoadingHistoryIdx(null);
                  }
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left shadow-2xs transition active:scale-[0.985]"
              >
                {r.logo ? (
                  <img
                    src={r.logo}
                    alt={r.name}
                    className="h-10 w-10 flex-none rounded-full border border-border bg-page object-cover shadow-xs"
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary font-display text-[12px] font-bold text-white shadow-xs"
                  style={{ display: r.logo ? "none" : "flex" }}
                >
                  {r.name.slice(0, 2).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold text-text-1">{r.name}</span>
                  <span className="mono block text-[12px] font-semibold text-text-2">{r.num}</span>
                  <span className="block text-[11.5px] font-medium text-text-3">{r.subtitle}</span>
                </div>

                <span className="flex-none rounded-full bg-teal-soft px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-teal">
                  RECENT
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OPERATORS LIST */}
      <div>
        {filteredRecents.length > 0 && (
          <div className="mb-2 px-1 font-display text-[13px] font-bold text-text-1">
            All Operators
          </div>
        )}

        <div className="flex flex-col gap-2">
          {items.map((b, idx) => (
            <button
              key={b.id || b.n || idx}
              onClick={() => {
                useBill.getState().reset();
                useRecharge.getState().set({
                  mode: "bill",
                  serviceType: typeKey,
                  operator: String(b.id || ""),
                  operatorName: b.n,
                  operatorLogo: b.logo || null,
                  num: "",
                  field1: "",
                  field2: "",
                  field3: "",
                  field4: "",
                  session_id: null,
                  operatorPlanSessionId: null,
                  billdata: null,
                  custName: null,
                  amount: 0,
                  billAmount: 0,
                  paymentDetails: null,
                  details: null,
                  slabs: [],
                  receipt: null,
                  fromHistory: false,
                });
                router.push(
                  `/billers/form?type=${typeKey}&cat=${catIndex}&biller=${rawItems.indexOf(b)}${
                    b.id ? `&operator=${b.id}` : ""
                  }`
                );
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 text-left active:scale-[0.985] shadow-2xs transition"
            >
              {/* Operator Logo Avatar */}
              {b.logo ? (
                <img
                  src={b.logo}
                  alt={b.n}
                  className="h-[42px] w-[42px] flex-none rounded-xl border border-border bg-page object-cover shadow-2xs"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <span
                className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl font-display text-[13px] font-bold text-white shadow-2xs"
                style={{
                  background: b.c || "#3B0764",
                  display: b.logo ? "none" : "flex",
                }}
              >
                {b.a}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-semibold text-text-1">{b.n}</span>
                <span className="block text-[11px] font-medium text-text-3">{b.sub}</span>
              </span>

              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-soft text-primary">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
                  <path d="M8.5 4.5 16 12l-7.5 7.5-1.8-1.8L12.4 12 6.7 6.3Z" />
                </svg>
              </span>
            </button>
          ))}

          {!items.length && (
            <div className="py-6 text-center text-[12.5px] font-medium text-text-3">
              No operator matches your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
