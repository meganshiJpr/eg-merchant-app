"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BILLERS } from "../data";
import { SearchInput } from "@/components/ui/SearchInput";
import { fetchRechargeHistory } from "@/features/recharge/api";
import { formatRechargeDate } from "@/features/recharge/data";
import { useRecharge } from "@/features/recharge/store";

function getOperatorsByTypeFromSession(categoryType) {
  if (typeof window === "undefined") return [];
  try {
    const cached = sessionStorage.getItem("contractor_list_session");
    if (!cached) return [];
    const parsed = JSON.parse(cached);
    const rawOps = parsed?.operators?.all || (Array.isArray(parsed) ? parsed : []);
    const basePath = parsed?.operator_img || "https://staging.paybyapis.com/images/operators/";

    if (!Array.isArray(rawOps)) return [];

    const targetType = String(categoryType || "DTH").toUpperCase();

    return rawOps
      .filter((op) => op.type && String(op.type).toUpperCase() === targetType)
      .map((op) => {
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
          sub: `All India`,
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
  const [q, setQ] = useState("");
  const [recentHistory, setRecentHistory] = useState([]);

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

          const numKey = String(item.number).trim();
          const dateVal = Number(item.date || 0);
          const matchedOp = opMap.get(String(item.operator));
          const subtitleText = item?.msg
            ? item.msg.replace(/^Continue payment of ₹\d+/i, "Continue payment")
            : "Continue payment";

          const entry = {
            num: numKey,
            opId: String(item.operator),
            name: matchedOp?.n || item.operator_name || `${typeKey} Account`,
            logo: matchedOp?.logo || null,
            subtitle: item?.msg ? `${item.msg}` : subtitleText,
            date: dateVal,
            isUnfinished: true,
          };

          const existing = historyMap.get(numKey);
          if (!existing || dateVal >= existing.date) {
            historyMap.set(numKey, entry);
          }
        });

        finished.forEach((item) => {
          if (!item || !item.number) return;

          const numKey = String(item.number).trim();
          const dateVal = Number(item.date || 0);
          const matchedOp = opMap.get(String(item.operator));
          const dateStr = formatRechargeDate(item.date);
          const subtitleText = `Last recharge of ₹${item.amount || "0"}${dateStr ? ` on ${dateStr}` : ""}`;

          const entry = {
            num: numKey,
            opId: String(item.operator),
            name: matchedOp?.n || item.operator_name || `${typeKey} Account`,
            logo: matchedOp?.logo || null,
            subtitle: subtitleText,
            date: dateVal,
            isUnfinished: false,
          };

          const existing = historyMap.get(numKey);
          if (!existing || (!existing.isUnfinished && dateVal > existing.date)) {
            historyMap.set(numKey, entry);
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
    return cat.items;
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
                onClick={() => {
                  useRecharge.getState().set({
                    mode: "bill",
                    serviceType: typeKey,
                    operator: String(r.opId),
                    operatorName: r.name,
                    operatorLogo: r.logo || null,
                    num: String(r.num),
                    session_id: null,
                    billdata: null,
                    custName: null,
                    amount: 0,
                    billAmount: 0,
                    paymentDetails: null,
                    details: null,
                    slabs: [],
                  });
                  router.push(
                    `/billers/form?type=${typeKey}&operator=${r.opId}&number=${r.num}`
                  );
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
                useRecharge.getState().set({
                  mode: "bill",
                  serviceType: typeKey,
                  operator: String(b.id || ""),
                  operatorName: b.n,
                  operatorLogo: b.logo || null,
                  num: "",
                  session_id: null,
                  billdata: null,
                  custName: null,
                  amount: 0,
                  billAmount: 0,
                  paymentDetails: null,
                  details: null,
                  slabs: [],
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
