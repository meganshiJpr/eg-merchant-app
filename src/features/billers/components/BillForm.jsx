"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BILLERS, BUTTON_LABEL } from "../data";
import { useBill } from "../store";
import { fetchBillerinfo, fetchBillOperatorDetails, fetchOperatorBillInfo } from "@/features/recharge/api";
import { useRecharge } from "@/features/recharge/store";
import { useToast } from "@/components/ui/Toast";

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
  if (f.optional && v.length === 0) return true;
  if (f.type === "sel") return v.length > 0;
  if (f.type === "date") {
    if (v.length !== 10) return false;
    const dd = +v.slice(0, 2), mm = +v.slice(3, 5);
    return dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12;
  }
  const chars = f.type === "txt" ? v : v.replace(/\D/g, "");
  const minBound = f.min ?? 1;
  const maxBound = f.max ?? 50;
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
  const toast = useToast((t) => t.show);

  const flow = useRecharge();
  const activeBillCtx = useBill.getState().ctx;
  const activeOperatorId = operatorId || flow?.operator || activeBillCtx?.biller?.id || null;
  const activeCategoryType = categoryType || flow?.serviceType || activeBillCtx?.categoryType || "DTH";

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

  const storeBiller = flow?.operatorName ? {
    id: String(activeOperatorId),
    n: flow.operatorName,
    sub: "All India",
    logo: flow.operatorLogo,
    a: flow.operatorName ? flow.operatorName.slice(0, 2).toUpperCase() : "BL",
    c: "#3B0764",
    btn: "info",
    fields: sessionBiller?.fields || [{ label: "Customer ID / Account Number", type: "num", ph: "Enter ID", min: 4, max: 20 }],
  } : null;

  const biller = sessionBiller || storeBiller || staticBiller;
  const fields = biller?.fields || [{ label: "Customer ID / Account Number", type: "num", ph: "Enter ID", min: 4, max: 20 }];

  const getRestorableValues = (targetOpId) => {
    const storeOpMatch = flow?.operator && String(flow.operator) === String(targetOpId);
    const ctxOpMatch = activeBillCtx?.biller?.id && String(activeBillCtx.biller.id) === String(targetOpId);

    const restored = ["", "", "", "", ""];

    if (initialNumber && String(initialNumber).trim()) {
      restored[0] = String(initialNumber).trim();
    } else if (storeOpMatch && flow?.fromHistory && flow?.num) {
      restored[0] = String(flow.num).trim();
    } else if (ctxOpMatch && activeBillCtx?.account) {
      restored[0] = String(activeBillCtx.account).trim();
    }

    if (storeOpMatch && flow?.fromHistory) {
      if (flow?.field1) restored[1] = String(flow.field1).trim();
      if (flow?.field2) restored[2] = String(flow.field2).trim();
      if (flow?.field3) restored[3] = String(flow.field3).trim();
      if (flow?.field4) restored[4] = String(flow.field4).trim();
    }

    return restored;
  };

  const [opDetails, setOpDetails] = useState(null);
  const [loadingOpDetails, setLoadingOpDetails] = useState(false);
  const [userAmount, setUserAmount] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  

  // Fetch operator details for Electricity, Water, Gas, FASTag (Exclude Mobile & DTH)
  useEffect(() => {
    if (!activeOperatorId || categoryType === "DTH" || categoryType === "Prepaid") {
      return;
    }

    let active = true;
    async function loadOpDetails() {
      try {
        setLoadingOpDetails(true);
        const res = await fetchBillOperatorDetails({ operator: activeOperatorId });
        if (active && res) {
          setOpDetails(res);
          if (Array.isArray(res.slabs) && res.slabs.length > 0) {
            useRecharge.getState().set({ slabs: res.slabs });
          }
        }
      } catch (err) {
        console.error("fetchBillOperatorDetails Error:", err);
      } finally {
        if (active) setLoadingOpDetails(false);
      }
    }

    loadOpDetails();
    return () => {
      active = false;
    };
  }, [activeOperatorId, categoryType]);

  // Dynamically parse input field configurations from operatorDetails
  const dynamicFields = useMemo(() => {
    if (categoryType === "DTH" || categoryType === "Prepaid" || !opDetails) {
      return null;
    }

    const fieldKeys = ["number_data", "field1_data", "field2_data", "field3_data", "field4_data"];
    const parsedList = [];

    fieldKeys.forEach((key) => {
      const raw = opDetails[key];
      if (!raw) return;

      try {
        const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!obj || typeof obj !== "object") return;

        const label = obj.numberText || "Account Number";
        const ph = obj.eg || `Enter ${label}`;
        const min = obj.minLength ? Number(obj.minLength) : 1;
        const max = obj.maxLength ? Number(obj.maxLength) : 50;
        const type = obj.numberType === "numeric" ? "num" : "txt";
        const optional = Boolean(obj.is_optional);
        const isSelect = Boolean(obj.is_select);
        const rawSelectValues = Array.isArray(obj.select_values) ? obj.select_values : [];
        const options = rawSelectValues.map((opt, optIdx) => {
          if (typeof opt === "object" && opt !== null) {
            const idVal = String(opt.id ?? opt.value ?? optIdx);
            const textVal = String(opt.value ?? opt.id ?? optIdx);
            return { id: idVal, value: textVal };
          }
          return { id: String(opt), value: String(opt) };
        });

        parsedList.push({
          key,
          label,
          ph,
          min,
          max,
          type: isSelect ? "sel" : type,
          optional,
          options,
        });
      } catch (e) {
        console.warn("Failed to parse field config:", key, e);
      }
    });

    return parsedList.length > 0 ? parsedList : null;
  }, [opDetails, categoryType]);

  const activeFields = dynamicFields || fields;

  const isFetchMode = opDetails ? String(opDetails.is_fetch) === "1" : true;
  const minAmt = opDetails?.min_amount ? Number(opDetails.min_amount) : 10;
  const maxAmt = opDetails?.max_amount ? Number(opDetails.max_amount) : 50000;

  const amtValid = isFetchMode
    ? true
    : Number(userAmount) >= minAmt && Number(userAmount) <= maxAmt;

  const [values, setValues] = useState(() => {
    const restored = getRestorableValues(activeOperatorId);
    return (activeFields || [{}]).map((f, idx) => {
      const rawVal = restored[idx] || "";
      if (rawVal) {
        return formatField(f || { type: "num" }, rawVal);
      }
      return "";
    });
  });

  useEffect(() => {
    const restored = getRestorableValues(activeOperatorId);

    setValues((prev) => {
      let changed = false;
      const next = [...prev];

      (activeFields || []).forEach((f, idx) => {
        const restoredVal = restored[idx] ? formatField(f || { type: "num" }, restored[idx]) : "";
        if (!next[idx] && restoredVal) {
          next[idx] = restoredVal;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [initialNumber, activeOperatorId, activeCategoryType, activeFields]);

  const [fetching, setFetching] = useState(false);

  const valid = useMemo(
    () => activeFields.every((f, i) => validField(f, values[i])) && amtValid,
    [activeFields, values, amtValid]
  );

  function update(i, raw) {
    setValues((prev) => {
      const next = [...prev];
      next[i] = formatField(activeFields[i] || { type: "num" }, raw);
      return next;
    });
  }

  async function proceed() {
    const account = values[0] || values.join(" · ");
    const opId = biller.id || operatorId || "38";

    setFetching(true);
    try {
      let infoRes = null;

      if (categoryType === "DTH") {
        infoRes = await fetchBillerinfo({
          operator: opId,
          number: account,
        }).catch((err) => {
          console.warn("fetchBillerinfo error:", err);
          return null;
        });
      } else {
        const reqPayload = {
          number: String(values[0] || "").trim(),
          operator: String(opId),
          type: String(categoryType || "Electricity"),
          field1: String(values[1] || "").trim(),
          field2: String(values[2] || "").trim(),
          field3: String(values[3] || "").trim(),
          field4: String(values[4] || "").trim(),
        };
        console.log("Calling fetchOperatorBillInfo API:", reqPayload);
        infoRes = await fetchOperatorBillInfo(reqPayload).catch((err) => {
          console.warn("fetchOperatorBillInfo error:", err);
          return null;
        });
      }

      console.log("response of the other bills api", infoRes);

      if (categoryType !== "DTH" && infoRes && (infoRes.success === 0 || infoRes.success === "0")) {
        const msg = infoRes.message || "Payment received for the billing period - no bill due";
        toast(msg);
        console.log("fetchOperatorBillInfo returned business response (success: 0):", infoRes);
        setFetching(false);
        return;
      }

      const billdata = infoRes?.billdata || (infoRes?.message ? { Message: infoRes.message } : {});
      const custName = billdata["Customer Name"] || infoRes?.custName || null;
      const session_id = infoRes?.session_id || null;
      const existingSlabs = useRecharge.getState().slabs || [];
      const slabs =
        Array.isArray(infoRes?.slabs) && infoRes.slabs.length > 0
          ? infoRes.slabs
          : (Array.isArray(opDetails?.slabs) && opDetails.slabs.length > 0
              ? opDetails.slabs
              : existingSlabs);

      const returnedAmt = infoRes?.billAmount !== undefined ? Number(infoRes.billAmount) : Number(infoRes?.amount ?? 0);
      const billAmount = !isFetchMode && Number(userAmount) > 0 ? Number(userAmount) : returnedAmt;
      const planDetails = infoRes?.details || infoRes?.records || null;
      const isEditable = infoRes?.amountEditable !== false;

      // Save directly into useRecharge single source of truth store
      useRecharge.getState().set({
        mode: "bill",
        serviceType: categoryType || "-",
        num: account,
        field1: String(values[1] || "").trim(),
        field2: String(values[2] || "").trim(),
        field3: String(values[3] || "").trim(),
        field4: String(values[4] || "").trim(),
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
        amountEditable: isEditable,
        paymentDetails: null,
      });

      const base = {
        biller,
        catTitle: cat.title,
        catIndex,
        categoryType,
        account,
        line2: `${cat.title} · ${account}`,
        amin: minAmt,
        amax: maxAmt,
        session_id,
        billdata,
        slabs,
        billAmount,
        amount: billAmount,
        editable: isEditable,
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

  const btnLabelText = opDetails?.bill_fetch_button || BUTTON_LABEL[biller.btn] || "Proceed";

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

      {loadingOpDetails ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-[13px] font-medium text-text-2">Loading operator fields...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {activeFields.map((f, i) => (
            <div key={f.key || f.label || i}>
              <label className="mb-1.5 block text-[12px] font-semibold text-text-2">
                {f.label} {!f.optional && <span className="text-rose-500">*</span>}
              </label>
              {f.type === "sel" ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === i ? null : i)
                    }
                    className="flex w-full items-center justify-between rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-left text-[14px] outline-none focus:border-primary"
                  >
                    <span className={values[i] ? "text-text-1" : "text-text-3"}>
                      {values[i] || `Select ${f.label.toLowerCase()}`}
                    </span>

                    <span className="ml-2 text-text-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-text-3"><path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </button> 

                  {openDropdown === i && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                      <button
                        type="button"
                        disabled
                        className="w-full px-4 py-3 text-left text-[14px] text-text-3"
                      >
                        Select {f.label.toLowerCase()}
                      </button>

                      {(f.options || []).map((option, optIdx) => {
                        const optVal =
                          typeof option === "object" && option !== null
                            ? String(option.id ?? option.value ?? "")
                            : String(option);

                        const optLabel =
                          typeof option === "object" && option !== null
                            ? String(option.value ?? option.id ?? "")
                            : String(option);

                        return (
                          <button
                            type="button"
                            key={`${optVal}-${optIdx}`}
                            onClick={() => {
                              update(i, optVal);
                              setOpenDropdown(null);
                            }}
                            className={`w-full px-4 py-3 text-left text-[14px] transition hover:bg-primary/10 ${values[i] === optVal
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-text-1"
                              }`}
                          >
                            {optLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  value={values[i] || ""}
                  onChange={(e) => update(i, e.target.value)}
                  inputMode={f.type === "num" || f.type === "date" ? "numeric" : "text"}
                  maxLength={f.type === "date" ? 10 : f.max}
                  placeholder={f.ph || f.label}
                  className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary placeholder:font-body placeholder:text-text-3 shadow-2xs"
                />
              )}
              {f.ph && <div className="mt-1 text-[12px] font-medium text-text-3">{f.ph}</div>}
            </div>
          ))}

          {/* Amount Input Field (Only when is_fetch is NOT "1") */}
          {!isFetchMode && (
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-text-2">
                Amount <span className="text-rose-500">*</span>
              </label>
              <input
                value={userAmount}
                onChange={(e) => setUserAmount(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="₹ Enter Amount"
                className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary placeholder:font-body placeholder:text-text-3 shadow-2xs"
              />
              <div className="mt-1 text-[12px] font-medium text-text-3">
                Minimum: ₹{minAmt} · Maximum: ₹{maxAmt}
              </div>
            </div>
          )}
        </div>
      )}

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
          {btnLabelText}
        </button>
      </div>
    </div>
  );
}
