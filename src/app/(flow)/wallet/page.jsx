"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/store/wallet";
import { useToast } from "@/components/ui/Toast";
import { inr } from "@/utils/format";
import { fetchWalletSetting } from "@/features/wallet/api";

const CHIPS = [100, 500, 1000, 2000, 5000];

export default function WalletPage() {
  const router = useRouter();
  const wallet = useWallet();
  const toast = useToast((t) => t.show);

  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amt, setAmt] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);


  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await fetchWalletSetting();
        if (isMounted && data) {
          if (data.isKycNotice && data.kycMessage) {
            toast(data.kycMessage);
          }
          setSetting(data);
        }
      } catch (err) {
        console.error("Error loading wallet settings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  // Parse API properties with fallbacks
  const manualOpt = useMemo(() => {
    if (!setting) return true; // Default fallback
    return (
      setting.manual_opt === true ||
      setting.manual_opt === 1 ||
      String(setting.manual_opt).toLowerCase() === "true"
    );
  }, [setting]);

  const minAmt = useMemo(() => {
    const parsed = Number(setting?.min_amount);
    return !isNaN(parsed) && parsed > 0 ? parsed : 10;
  }, [setting]);

  const maxAmt = useMemo(() => {
    const parsed = Number(setting?.max_amount);
    return !isNaN(parsed) && parsed > 0 ? parsed : 20000;
  }, [setting]);

  const currentBalance = useMemo(() => {
    if (setting && setting.ledger_balance !== undefined && setting.ledger_balance !== null) {
      return Number(setting.ledger_balance);
    }
    return wallet.balance;
  }, [setting, wallet.balance]);

  const qnaList = useMemo(() => {
    return Array.isArray(setting?.ledger_qna) ? setting.ledger_qna : [];
  }, [setting]);

  // Sliders data parsing
  const sliderData = setting?.sliders;
  const slidePath = sliderData?.slide_path || sliderData?.imageUrl || "";
  const slidersList = Array.isArray(sliderData?.sliders) ? sliderData.sliders : [];

  // Validation
  const numAmt = Number(amt || 0);
  const isAmtValid = numAmt >= minAmt && numAmt <= maxAmt;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleProceed = () => {
    if (!isAmtValid) return;

    if (activeMethod.id === "qr") {
      setShowQrModal(true);
      return;
    }

    wallet.credit(numAmt);
    toast(`Rs ${inr(numAmt)} added to wallet via ${activeMethod.name}`);
    setAmt(0);
  };

  return (
    <div className="flex min-h-screen flex-col bg-page pb-24 text-text-1">
      {/* 2. HEADER */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface px-4 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-2xs transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-text-1">
              <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
            </svg>
          </button>
          <h1 className="font-display text-[16px] font-bold">Wallet</h1>
        </div>

        {/* Show Manual Deposit button only when manual_opt === true */}
        {manualOpt && (
          <button
            onClick={() => router.push("/wallet/manual-deposit")}
            className="flex items-center gap-1.5 rounded-xl border border-primary px-3 py-1.5 font-display text-[12px] font-bold text-primary shadow-2xs transition active:scale-95"
          >
            <svg className="h-3.5 w-3.5 fill-primary" viewBox="0 0 24 24">
              <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-5-7L2 7v2h19V7l-9-5z" />
            </svg>
            <span>Manual Deposit</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* 9. API LOADING STATE */}
        {loading && (
          <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface p-4 text-[13px] font-medium text-text-2 shadow-xs">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span>Loading wallet settings...</span>
          </div>
        )}
            {slidersList.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
                <div className="relative aspect-[31/10] w-full">
                  <img
                    src={
                      slidersList[currentSlideIndex]?.image?.startsWith("http")
                        ? slidersList[currentSlideIndex].image
                        : `${slidePath}${slidersList[currentSlideIndex]?.image}`
                    }
                    alt="Promo Banner"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                {slidersList.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    {slidersList.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentSlideIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

        {/* 3. WALLET BALANCE CARD */}
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 p-4 px-5 text-white shadow-md">
          <div>
            <div className="text-[13px] font-small text-white/80">Current balance</div>
            <div className="mono mt-1 text-[32px] font-bold tracking-tight">
              Rs {inr(currentBalance)}
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md shadow-inner">
            <svg className="h-6 w-6 fill-white" viewBox="0 0 24 24">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
            </svg>
          </div>
        </div>

        {/* 5. AMOUNT INPUT & RECOMMENDATION CHIPS */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
          <label className="text-[13px] font-bold text-text-1">Enter amount to add</label>

          <div className="relative flex items-center rounded-xl border-[1.5px] border-border bg-surface px-4 py-3.5 shadow-2xs focus-within:border-primary transition">
            <span className="mono text-[22px] font-bold text-text-1 mr-2">Rs</span>
            <input
              type="number"
              inputMode="numeric"
              value={amt === 0 ? "" : amt}
              onChange={(e) => {
                const val = e.target.value;
                setAmt(val === "" ? 0 : Math.max(0, parseInt(val, 10) || 0));
              }}
              placeholder="0"
              className="mono w-full text-[22px] font-bold text-text-1 outline-none bg-transparent placeholder:text-text-3"
            />
            {numAmt > 0 && (
              <button
                type="button"
                onClick={() => setAmt(0)}
                className="ml-2 text-[12.5px] font-semibold text-text-3 hover:text-text-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dynamic Light Min / Max Helper Text directly under input field */}
          <div className="mt-0.5 flex justify-center gap-10 px-1 text-[11.5px] font-medium text-text-3">
            <span>Min Rs {inr(minAmt)}</span>
            <span> Max Rs {inr(maxAmt)}</span>
          </div>

          {/* Recommendation Chips */}
          <div className="mt-2 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAmt((a) => a + c)}
                className="rounded-full border border-border bg-page px-3.5 py-1.5 text-[12px] font-bold text-primary shadow-2xs transition active:scale-95 hover:bg-primary/5"
              >
                + {inr(c)}
              </button>
            ))}
          </div>
        </div>

        {/* 7. THINGS TO KNOW / LEDGER QNA */}
        {qnaList.length > 0 && (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
            <div className="flex items-center gap-2 font-display text-[13px] font-bold text-text-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">
                ℹ
              </span>
              <span>Things to know</span>
            </div>
            <ul className="flex flex-col gap-2 pl-1">
              {qnaList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-text-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 6. BOTTOM PAYMENT SELECTOR & PROCEED BAR */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3 shadow-lg">
        <button
          type="button"
          disabled={!isAmtValid}
          onClick={handleProceed}
          className="w-full rounded-xl bg-primary py-3.5 font-display text-[14px] font-bold text-white shadow-md transition active:scale-[0.985] disabled:opacity-40 disabled:pointer-events-none"
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
