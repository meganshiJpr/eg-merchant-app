"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BILLERS, BUTTON_LABEL } from "../data";
import { useBill } from "../store";
import { fetchBillerinfo } from "@/features/recharge/api";
import { useRecharge } from "@/features/recharge/store";

function getOperatorFromSession(operatorId, categoryType) {
  if (typeof window === "undefined" || !operatorId) return null;
  try {
    const cached = sessionStorage.getItem("contractor_list_session");
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    const rawOps = parsed?.operators?.all || (Array.isArray(parsed) ? parsed : []);
    const basePath = parsed?.operator_img || "https://staging.paybyapis.com/images/operators/";

    if (!Array.isArray(rawOps)) return null;

    const targetType = String(categoryType || "DTH").toUpperCase();
    const found = rawOps.find((op) => String(op.id) === String(operatorId));
    if (!found) return null;

    const logoUrl = found.logo
      ? found.logo.startsWith("http")
        ? found.logo
        : `${basePath}${found.logo}`
      : null;

    let numData = null;
    if (found.number_data) {
      try {
        numData = typeof found.number_data === "string" ? JSON.parse(found.number_data) : found.number_data;
      } catch {}
    }

    const fieldLabel = numData?.numberText || "Subscriber ID / Account Number";
    const fieldPh = numData?.eg || `Enter ${fieldLabel}`;
    const minLen = numData?.minLength ? Number(numData.minLength) : 8;
    const maxLen = numData?.maxLength ? Number(numData.maxLength) : 12;
    const isNumeric = numData?.numberType === "numeric";
    const inputType = isNumeric ? "num" : "txt";

    return {
      id: String(found.id),
      n: found.name,
      sub: `All India`,
      logo: logoUrl,
      a: found.name ? found.name.slice(0, 2).toUpperCase() : targetType.slice(0, 2),
      c: "#3B0764",
      btn: targetType === "DTH" ? "info" : "fetch",
      numberData: numData,
      fields: [{ label: fieldLabel, type: inputType, ph: fieldPh, min: minLen, max: maxLen }],
    };
  } catch (err) {
    console.warn("Could not read operator from session:", err);
    return null;
  }
}

function validField(f, raw) {
  const v = (raw || "").trim();
  if (f.type === "sel") return v.length > 0;
  if (f.type === "date") {
    if (v.length !== 10) return false;
    const dd = +v.slice(0, 2), mm = +v.slice(3, 5);
    return dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12;
  }
  const chars = f.type === "txt" ? v : v.replace(/\D/g, "");
  const minBound = f.min ?? 4;
  const maxBound = f.max ?? 20;
  return chars.length >= minBound && chars.length <= maxBound;
}

function formatField(f, v) {
  if (f.type === "num") return v.replace(/\D/g, "");
  if (f.type === "txt") return v.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (f.type === "date") {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }
  return v;
}

export function BillForm({ categoryType = "DTH", catIndex = 0, billerIndex = 0, operatorId = null, initialNumber = "" }) {
  const router = useRouter();
  const setBill = useBill((s) => s.set);

  const activeRecharge = useRecharge.getState();
  const activeBillCtx = useBill.getState().ctx;
  const activeOperatorId = operatorId || activeRecharge?.operator || activeBillCtx?.biller?.id || null;
  const activeCategoryType = categoryType || activeRecharge?.serviceType || activeBillCtx?.categoryType || "DTH";

  const cat = BILLERS[catIndex] || BILLERS[0] || { title: "Biller", items: [] };
  const staticBiller = cat?.items?.[billerIndex] || cat?.items?.[0] || {
    id: activeOperatorId || "38",
    n: activeCategoryType || "Biller",
    sub: "All India",
    c: "#3B0764",
    a: "BL",
    btn: "info",
    fields: [{ label: "Customer ID / Account Number", type: "num", ph: "Enter ID", min: 4, max: 20 }],
  };

  const sessionBiller = useMemo(() => {
    return getOperatorFromSession(activeOperatorId, activeCategoryType);
  }, [activeOperatorId, activeCategoryType]);

  const storeBiller = activeRecharge?.operatorName ? {
    id: String(activeOperatorId),
    n: activeRecharge.operatorName,
    sub: "All India",
    logo: activeRecharge.operatorLogo,
    a: activeRecharge.operatorName ? activeRecharge.operatorName.slice(0, 2).toUpperCase() : "BL",
    c: "#3B0764",
    btn: "info",
    fields: sessionBiller?.fields || [{ label: "Customer ID / Account Number", type: "num", ph: "Enter ID", min: 4, max: 20 }],
  } : null;

  const biller = sessionBiller || storeBiller || staticBiller;
  const fields = biller?.fields || [{ label: "Customer ID / Account Number", type: "num", ph: "Enter ID", min: 4, max: 20 }];

  const getRestorableNum = (targetOpId) => {
    if (initialNumber && String(initialNumber).trim()) {
      return String(initialNumber).trim();
    }

    const activeRechargeState = useRecharge.getState();
    const activeBillCtx = useBill.getState().ctx;

    const storeOpMatch = activeRechargeState?.operator && String(activeRechargeState.operator) === String(targetOpId);
    if (storeOpMatch && activeRechargeState?.num) {
      return String(activeRechargeState.num).trim();
    }

    const ctxOpMatch = activeBillCtx?.biller?.id && String(activeBillCtx.biller.id) === String(targetOpId);
    if (ctxOpMatch && activeBillCtx?.account) {
      return String(activeBillCtx.account).trim();
    }

    return "";
  };

  const [values, setValues] = useState(() => {
    const existingNum = getRestorableNum(activeOperatorId);
    const firstField = biller?.fields?.[0] || { type: "num" };

    return (biller?.fields || [{}]).map((f, idx) => {
      if (idx === 0 && existingNum) {
        return formatField(f || firstField, existingNum);
      }
      return "";
    });
  });

  useEffect(() => {
    const existingNum = getRestorableNum(activeOperatorId);
    const firstField = biller?.fields?.[0];

    if (firstField) {
      const restoredValue = existingNum ? formatField(firstField, existingNum) : "";
      setValues((prev) => {
        if (prev[0] === restoredValue) {
          return prev;
        }
        const next = [...prev];
        next[0] = restoredValue;
        return next;
      });
    }
  }, [initialNumber, activeOperatorId, activeCategoryType]);

  const [fetching, setFetching] = useState(false);

  const valid = useMemo(
    () => fields.every((f, i) => validField(f, values[i])),
    [fields, values]
  );

  function update(i, raw) {
    setValues((prev) => {
      const next = [...prev];
      next[i] = formatField(fields[i] || { type: "num" }, raw);
      return next;
    });
  }

  async function proceed() {
    const account = values[0] || values.join(" · ");
    const opId = biller.id || operatorId || "38";

    setFetching(true);
    try {
      const infoRes = await fetchBillerinfo({
        operator: opId,
        number: account,
      }).catch((err) => {
        console.warn("fetchBillerinfo error:", err);
        return null;
      });

      const billdata = infoRes?.billdata || {};
      const custName = billdata["Customer Name"] || infoRes?.custName || null;
      const slabs = Array.isArray(infoRes?.slabs) ? infoRes.slabs : [];
      const session_id = infoRes?.session_id || null;
      const billAmount = Number(infoRes?.billAmount ?? 0);
      const planDetails = infoRes?.details || infoRes?.records || null;

      // Save directly into useRecharge single source of truth store
      useRecharge.getState().set({
        mode: "bill",
        serviceType: categoryType || "-",
        num: account,
        operator: opId,
        operatorName: biller.n,
        operatorLogo: biller.logo,
        circle: "14",
        circleName: "Rajasthan",
        session_id: session_id,
        operatorPlanSessionId: session_id,
        billdata: billdata,
        slabs: slabs,
        billAmount: billAmount,
        amount: billAmount,
        custName: custName,
        details: planDetails,
        paymentDetails: null,
      });

      const base = {
        biller,
        catTitle: cat.title,
        catIndex,
        categoryType,
        account,
        line2: `${cat.title} · ${account}`,
        amin: cat.amin || 1,
        amax: cat.amax || 50000,
        session_id,
        billdata,
        slabs,
        billAmount,
        amount: billAmount,
        editable: true,
        custName,
        details: planDetails,
        title: infoRes?.title || "Customer Information",
      };

      setBill(base);
      router.push("/billers/pay");
    } catch (err) {
      console.error("Error in proceed:", err);
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="p-4">
      {/* Biller Header */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 shadow-2xs">
        {biller.logo ? (
          <img
            src={biller.logo}
            alt={biller.n}
            className="h-10 w-10 flex-none rounded-xl border border-border bg-page object-cover shadow-2xs"
            onError={(e) => {
              e.target.style.display = "none";
              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl font-display text-[12px] font-bold text-white shadow-2xs"
          style={{
            background: biller.c || "#3B0764",
            display: biller.logo ? "none" : "flex",
          }}
        >
          {biller.a}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold text-text-1">{biller.n}</div>
          <div className="text-[11.5px] font-medium text-text-3">{biller.sub}</div>
        </div>
      </div>

      {/* Dynamic Form Fields */}
      <div className="flex flex-col gap-3">
        {fields.map((f, i) => (
          <div key={f.label}>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">
              {f.label} <span className="text-rose-500">*</span>
            </label>
            {f.type === "sel" ? (
              <select
                value={values[i]}
                onChange={(e) => update(i, e.target.value)}
                className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select {f.label.toLowerCase()}
                </option>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                value={values[i]}
                onChange={(e) => update(i, e.target.value)}
                inputMode={f.type === "num" || f.type === "date" ? "numeric" : "text"}
                maxLength={f.type === "date" ? 10 : f.max}
                placeholder="Subscriber Id"
                className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary placeholder:font-body placeholder:text-text-3 shadow-2xs"
              />
              
            )}
            <div className="text-[13px] text-text-2">{f.ph}</div>
          </div>
        ))}
      </div>

      {fetching && (
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-[12.5px] font-medium text-text-2 shadow-2xs">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          {biller.btn === "fetch" ? "Fetching bill details..." : "Fetching customer info..."}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3">
        <button
          disabled={!valid || fetching}
          onClick={proceed}
          className="w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-bold text-white active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 transition shadow-xs"
        >
          {BUTTON_LABEL[biller.btn] || "Proceed"}
        </button>
      </div>
    </div>
  );
}
