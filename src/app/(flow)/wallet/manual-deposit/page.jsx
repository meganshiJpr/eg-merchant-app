"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { inr } from "@/utils/format";
import { fetchManualDepositDetails, FetchfundRequest } from "@/features/wallet/api";

function getBankAbbr(name) {
  if (!name) return "BK";
  const str = String(name).trim();
  const parts = str.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return str.slice(0, 2).toUpperCase();
}

function getBankColor(name) {
  const colors = ["#0284C7", "#DC2626", "#16A34A", "#7C3AED", "#D97706", "#2563EB", "#059669"];
  let hash = 0;
  const str = String(name || "bank");
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

export default function ManualDepositPage() {
  const router = useRouter();
  const toast = useToast((t) => t.show);

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedMode, setSelectedMode] = useState("");
  const [utr, setUtr] = useState("");
  const [amt, setAmt] = useState("");
  const [remark, setRemark] = useState("");

  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState({ amount: 0, requestId: "" });

  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      try {
        setLoading(true);
        const res = await fetchManualDepositDetails();
        if (isMounted && res) {
          if (res.isKycNotice && res.kycMessage) {
            toast(res.kycMessage);
          }
          setApiData(res);

          if (Array.isArray(res.payment_details) && res.payment_details.length > 0) {
            setSelectedBank(res.payment_details[0]);
          }

          if (Array.isArray(res.payment_modes)) {
            const valid = res.payment_modes.filter(
              (m) => m?.name && m.name !== "Select Payment Mode"
            );
            if (valid.length > 0) {
              setSelectedMode(valid[0].name);
            }
          }
        }
      } catch (err) {
        console.error("Error loading bank details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, []);

  // Parse API limits & data safely
  const minAmt = useMemo(() => {
    const parsed = Number(apiData?.min_amount);
    return !isNaN(parsed) && parsed > 0 ? parsed : 50;
  }, [apiData]);

  const maxAmt = useMemo(() => {
    const parsed = Number(apiData?.max_amount);
    return !isNaN(parsed) && parsed > 0 ? parsed : 1000000;
  }, [apiData]);

  const paymentDetails = useMemo(() => {
    return Array.isArray(apiData?.payment_details) ? apiData.payment_details : [];
  }, [apiData]);

  const validPaymentModes = useMemo(() => {
    if (!Array.isArray(apiData?.payment_modes)) return [];
    return apiData.payment_modes.filter((m) => m?.name && m.name !== "Select Payment Mode");
  }, [apiData]);

  // Validation
  const numAmt = Number(amt || 0);
  const isAmtValid = numAmt >= minAmt && numAmt <= maxAmt;
  const isFormValid =
    selectedBank !== null &&
    Boolean(selectedMode) &&
    selectedMode !== "Select Payment Mode" &&
    utr.trim().length >= 4 &&
    isAmtValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    try {
      const bankFormatted = `${selectedBank?.bank_name || ""} (${selectedBank?.ac_no || ""})`.trim();
      const res = await FetchfundRequest({
        mode: selectedMode,
        bank: bankFormatted,
        amount: numAmt,
        ref_no: utr.trim(),
        comment: remark.trim(),
      });

      if (res && (res.success === 0 || res.success === "0" || res.success === false)) {
        toast(res.message || "Failed to submit request.");
        return;
      }

      const requestId =
        res?.request_id ||
        res?.id ||
        res?.data?.request_id ||
        res?.data?.id ||
        res?.req_id ||
        "MD" + Math.floor(10000000 + Math.random() * 90000000);

      setSuccessData({
        amount: numAmt,
        requestId: requestId,
      });
      setSuccessModalOpen(true);
    } catch (err) {
      const errMsg = err?.message || err?.data?.message || "Failed to submit deposit request. Please try again.";
      toast(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24 text-text-1">
      <SubHeader title="Manual Deposit" backHref="/wallet" showImg={false}/>

      <div className="flex flex-col gap-4 p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface p-4 text-[13px] font-medium text-text-2 shadow-xs">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading deposit details...</span>
          </div>
        )}

        <div className="flex items-start gap-3 rounded-2xl border border-[#f07800] bg-[#fef0e0] p-4 text-amber-900 shadow-2xs">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f07800] text-[10px] font-small text-white mt-0.5">
            ℹ
          </div>
          <div>
            <div className="font-display text-[11px] font-bold uppercase tracking-wider text-amber-800">
              DEPOSIT LIMIT
            </div>
            <div className="mt-0.5 text-[12.5px] font-medium text-amber-900">
              Minimum <span className="font-bold">Rs {inr(minAmt)}</span> · Maximum{" "}
              <span className="font-bold">Rs {inr(maxAmt)}</span> per request
            </div>
          </div>
        </div>

        {/* 3. DEPOSITED IN BANK DROPDOWN */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-bold text-text-1">
            Deposited in bank <span className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setBankSheetOpen(true)}
            className="flex w-full items-center justify-between rounded-xl border-[1.5px] border-border bg-surface p-3 text-left shadow-2xs transition active:scale-[0.99] focus:border-primary"
          >
            {selectedBank ? (
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[11px] font-bold text-white shadow-2xs"
                  style={{ background: getBankColor(selectedBank.bank_name) }}
                >
                  {getBankAbbr(selectedBank.bank_name)}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-text-1 leading-tight">
                    {selectedBank.bank_name}
                  </div>
                  <div className="mono mt-0.5 text-[11px] text-text-3">
                    A/c {selectedBank.ac_no} · IFSC {selectedBank.ifsc_code}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-[13.5px] font-medium text-text-3">Select bank account</span>
            )}
            <svg className="h-4 w-4 fill-text-3 shrink-0 ml-2" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-bold text-text-1">
            Payment mode <span className="text-rose-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {validPaymentModes.map((mode) => {
              const isSelected = selectedMode === mode.name;
              return (
                <button
                  key={mode.name}
                  type="button"
                  onClick={() => setSelectedMode(mode.name)}
                  className={`rounded-full border px-4 py-2 text-[12px] font-bold transition active:scale-95 ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-xs"
                      : "border-border bg-surface text-text-1 hover:border-primary/40"
                  }`}
                >
                  {mode.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. BANK REFERENCE NUMBER / UTR */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-bold text-text-1">
            Bank reference number / UTR <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="e.g. 415612345678"
            className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[13.5px] font-semibold outline-none focus:border-primary placeholder:font-body placeholder:text-[13px] placeholder:font-normal placeholder:text-text-3 shadow-2xs"
          />
        </div>

        {/* AMOUNT TRANSFERRED */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-bold text-text-1">
            Amount transferred <span className="text-rose-500">*</span>
          </label>
          <div className="relative flex items-center rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 shadow-2xs focus-within:border-primary transition">
            <span className="mono text-[16px] font-bold text-text-1 mr-2">Rs</span>
            <input
              type="number"
              inputMode="numeric"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
              placeholder="0"
              className="mono w-full text-[16px] font-bold text-text-1 outline-none bg-transparent placeholder:text-text-3"
            />
          </div>

          {/* Dynamic Light Min / Max Helper Text */}
          <div className="mt-0.5 flex items-center justify-between px-1 text-[11.5px] font-medium text-text-3">
            <span>
              Min Rs {inr(minAmt)}, max Rs {inr(maxAmt)}
            </span>
            {numAmt > 0 && numAmt < minAmt && (
              <span className="font-semibold text-amber-600">Min Rs {inr(minAmt)} required</span>
            )}
            {numAmt > maxAmt && (
              <span className="font-semibold text-rose-600">Max limit Rs {inr(maxAmt)}</span>
            )}
          </div>
        </div>

        {/* REMARK (OPTIONAL) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-bold text-text-1">Remark</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Any note for our team (optional)"
            rows={3}
            className="w-full rounded-xl border-[1.5px] border-border bg-surface p-3.5 text-[13px] outline-none focus:border-primary placeholder:text-text-3 shadow-2xs"
          />
        </div>

        {/* INFO CARD */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-border bg-surface p-4 text-[12px] text-text-2 shadow-2xs">
          <svg className="mt-0.5 h-4 w-4 shrink-0 fill-text-3" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <p className="leading-relaxed">
            Wallet will be credited after our team verifies your deposit against the bank statement.
            Usually within 30 minutes during working hours.
          </p>
        </div>
      </div>

      {/* FIXED BOTTOM SUBMIT BAR */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3 shadow-lg">
        <button
          type="button"
          disabled={!isFormValid || submitting}
          onClick={handleSubmit}
          className="w-full rounded-xl bg-primary py-3.5 font-display text-[14px] font-bold text-white shadow-md transition active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>

      {/* 3. COMPANY BANK ACCOUNTS BOTTOM SHEET */}
      <Sheet id="company-bank-sheet" open={bankSheetOpen} onClose={() => setBankSheetOpen(false)}>
        <div className="p-3">
          <h3 className="font-display text-[16px] font-bold text-text-1 mb-4">
            Company bank accounts
          </h3>

          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {paymentDetails.map((bank, idx) => {
              const isSelected =
                selectedBank &&
                selectedBank.ac_no === bank.ac_no &&
                selectedBank.bank_name === bank.bank_name;

              return (
                <button
                  key={`${bank.ac_no}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedBank(bank);
                    setBankSheetOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl text-left transition active:scale-[0.985] `}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-bold text-white shadow-xs"
                      style={{ background: getBankColor(bank.bank_name) }}
                    >
                      {getBankAbbr(bank.bank_name)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold text-text-1 leading-tight">
                        {bank.bank_name}
                      </div>
                      <div className="mono mt-1 text-[11.5px] text-text-3">
                        A/c {bank.ac_no} · IFSC {bank.ifsc_code}
                      </div>
                      {/* {bank.ac_holder && (
                        <div className="text-[10.5px] font-medium text-text-3 truncate mt-0.5">
                          {bank.ac_holder}
                        </div>
                      )} */}
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div className="ml-3 shrink-0">
                    {isSelected ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-primary text-white">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-border" />
                    )}
                  </div>
                </button>
              );
            })}

            {!paymentDetails.length && (
              <div className="py-8 text-center text-[13px] text-text-3">
                No bank accounts available.
              </div>
            )}
          </div>
        </div>
      </Sheet>

      {/* 4. REQUEST SUBMITTED SUCCESS MODAL */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xs sm:max-w-sm rounded-3xl bg-surface p-6 text-center shadow-xl animate-in zoom-in-95 duration-200">
            {/* Checkmark Icon Circle */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f7f2]">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-[#00a878] stroke-[3]" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="font-display text-xl font-bold text-text-1 mb-2">
              Request Submitted!
            </h2>

            {/* Body Description */}
            <p className="text-[12.5px] font-medium leading-relaxed text-text-2 mb-3">
              Your deposit request of <span className="font-bold text-text-1">Rs {successData.amount.toLocaleString()}</span> has been received. Wallet will be credited after verification.
            </p>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => {
                setSuccessModalOpen(false);
                router.push("/");
              }}
              className="w-full rounded-2xl bg-[#0022ff] py-3.5 text-base font-bold text-white shadow-md active:scale-[0.985] transition hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
