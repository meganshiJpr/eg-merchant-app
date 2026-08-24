"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePay } from "../store";
import { useWallet } from "@/lib/store/wallet";
import { useToast } from "@/components/ui/Toast";
import { useRecharge } from "@/features/recharge/store";
import { Sheet } from "@/components/ui/Sheet";
import { MpinSheet } from "@/features/recharge/components/MpinSheet";
import { inr } from "@/utils/format";
import { fetchPaymentDetails } from "@/features/recharge/api";
import { ViewPlan } from "./ViewPlan";

const UPI_APPS = [
  { n: "PhonePe", c: "#5F259F", a: "Pe" },
  { n: "Google Pay", c: "#1A73E8", a: "G" },
  { n: "Paytm", c: "#00BAF2", a: "Pt" },
  { n: "Other UPI app", c: "#5B5F73", a: "UPI" },
];

function statusFromPin(pin) {
  const d = parseInt(pin[3], 10);
  if (d >= 1 && d <= 5) return "success";
  if (d <= 7) return "processing";
  if (d === 8) return "failed";
  return "refunded";
}

export function PayScreen() {
  const router = useRouter();
  const req = usePay((s) => s.req);
  const flow = useRecharge();
  const wallet = useWallet();
  const toast = useToast((t) => t.show);
  const setReceipt = useRecharge((s) => s.set);

  const [useWalletBal, setUseWalletBal] = useState(true);
  const [amountStr, setAmountStr] = useState("");
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiStatus, setUpiStatus] = useState("");
  const [mpinOpen, setMpinOpen] = useState(false);
  const [upiTopped, setUpiTopped] = useState(false);
  const [loadingBillerPayment, setLoadingBillerPayment] = useState(false);
  const [showPlans, setShowPlans] = useState(false);

  const planDetailsData = req?.details || flow?.details || null;

  const handlePlanSelect = (selectedPlan) => {
    const selectedAmount = Number(
      selectedPlan.rs ??
      selectedPlan.amount ??
      selectedPlan.price ??
      0
    );

    if (selectedAmount > 0) {
      setAmountStr(String(selectedAmount));
      setReceipt({
        amount: selectedAmount,
        billAmount: selectedAmount,
        plan: selectedPlan,
      });
    }
    setShowPlans(false);
  };

  useEffect(() => {
    if (!req) {
      router.replace("/");
      return;
    }
    setUseWalletBal(req.walletAllowed);
    setAmountStr(req.amount ? `Rs ${inr(req.amount)}` : "");
  }, [req, router]);

  const amount = useMemo(() => {
    if (!req) return 0;
    if (!req.editableAmount) return req.amount;
    const v = amountStr.replace(/[^0-9]/g, "");
    return v ? parseInt(v, 10) : 0;
  }, [req, amountStr]);

  if (!req) return null;

  console.log("request reponse",req)

  const amtOk = req.editableAmount ? amount >= req.amin && amount <= req.amax : amount > 0;
  const walletUsable = useWalletBal && req.walletAllowed ? wallet.balance : 0;
  const walletPortion = amtOk ? Math.min(walletUsable, amount) : 0;
  const short = amtOk ? amount - walletPortion : 0;
  const upiOnly = walletPortion === 0;
  const paidVia = walletPortion === 0 ? "UPI" : upiTopped ? "Wallet + UPI" : "Wallet";

  function onAmt(v) {
    const digits = v.replace(/[^0-9]/g, "");
    setAmountStr(digits ? `Rs ${inr(parseInt(digits, 10))}` : "");
  }

  function finish(status, via, walletDebit) {
    const deduct = status === "success" || status === "processing";
    if (deduct && walletDebit > 0) wallet.debit(walletDebit);
    const txnId = `${req.mode === "bill" ? "BP" : "RC"}${Date.now().toString().slice(-9)}`;
    setReceipt({
      receipt: {
        status,
        amount,
        paidVia: via,
        mode: req.mode,
        retryHref: status === "failed" || status === "refunded" ? req.backHref : null,
        rows: req.receiptRows(amount, via, txnId),
      },
    });
    router.push("/recharge/receipt");
  }

  function pickUpi(name) {
    setUpiStatus(`Opening ${name}...`);
    setTimeout(() => {
      setUpiOpen(false);
      setUpiStatus("");
      if (upiOnly) finish("success", "UPI", 0);
      else {
        wallet.credit(short);
        setUpiTopped(true);
        toast(`Rs ${inr(short)} added to wallet`);
        setMpinOpen(true);
      }
    }, 1200);
  }

  const btnLabel = !amtOk
    ? `Enter Rs ${inr(req.amin)} – ${inr(req.amax)}`
    : short > 0
      ? upiOnly
        ? `Pay Rs ${inr(short)} via UPI`
        : `Add Rs ${inr(short)} & Proceed`
      : `${req.mode === "bill" ? "Proceed to pay" : "Recharge"}`;

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      {/* Selected entity */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3 shadow-2xs">
        {req.avatar?.logo ? (
          <img
            src={req.avatar.logo}
            alt={req.line1}
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
            background: req.avatar?.color || "var(--primary)",
            display: req.avatar?.logo ? "none" : "flex",
          }}
        >
          {req.avatar?.text}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-bold text-text-1">{req.custName}</div>
          <div className="flex gap-1">
            <span className="text-[11.5px] font-medium text-text-3">{req.account} •</span>
          <div className="text-[11.5px] font-medium text-text-3">{req.line1}</div>
          </div>
        </div>
      </div>

      {/* Amount (fixed or editable) */}
      <div className="py-3 text-center">
        {req.editableAmount ? (
          <input
            value={amountStr}
            onChange={(e) => onAmt(e.target.value)}
            inputMode="numeric"
            placeholder="Rs 0"
            className="mono w-[220px] border-b-2 border-primary bg-transparent pb-1.5 text-center text-[36px] font-semibold tracking-tight outline-none placeholder:opacity-40"
          />
        ) : (
          <div className="mono text-[40px] font-semibold tracking-tight">Rs {inr(amount)}</div>
        )}

        {/* HORIZONTAL AMOUNT RECOMMENDATION CHIPS (SLABS) */}
        {req.slabs && req.slabs.length > 0 && (
          <div className="mt-3.5 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-1">
            {req.slabs.map((slabVal) => (
              <button
                key={slabVal}
                type="button"
                onClick={() => onAmt(String(slabVal))}
                className={`flex-none rounded-full border px-3.5 py-1 text-[12.5px] font-bold transition active:scale-95 shadow-2xs ${
                  amount === Number(slabVal)
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text-1 hover:border-primary/50"
                }`}
              >
                Rs {inr(slabVal)}
              </button>
            ))}
          </div>
        )}

        {req.editableAmount && (
          <div className="mono mt-1.5 text-[12px] font-semibold text-text-3">
            Min Rs {inr(req.amin)} · Max Rs {inr(req.amax)}
          </div>
        )}
        {req.customNote && (
          <div className="mt-2 rounded-xl bg-primary-soft px-4 py-2.5 text-left text-[11.5px] leading-relaxed text-primary">
            {req.customNote}
          </div>
        )}
        {planDetailsData && (
          <button
            type="button"
            onClick={() => setShowPlans(true)}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-primary active:scale-95 transition cursor-pointer hover:underline"
          >
            <span>View plan</span>
          </button>
        )}
      </div>

      {/* Benefits (plan mode) */}
      {req.benefits && (
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <div className="grid grid-cols-4 divide-x divide-border rounded-xl bg-page py-2">
            {req.benefits.map((b) => (
              <div key={b.l} className="px-1 text-center">
                <div className="text-[11px] font-semibold leading-tight">{b.v}</div>
                <div className="mt-0.5 text-[9.5px] text-text-3">{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fetched bill/customer data (bill mode) */}
      {req.fetched && req.fetched.rows && req.fetched.rows.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-1 shadow-2xs">
          <div className="flex items-center gap-2 py-2.5 text-[12px] font-bold text-teal">
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]">
              <path d="M6 12.5 10.2 16.7 18 8.5" stroke="var(--teal)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {req.fetched.title}
          </div>
          {req.fetched.rows
            .filter((r) => r.v !== null && r.v !== undefined && String(r.v).trim() !== "")
            .map((r) => (
              <div key={r.k} className="flex justify-between border-t border-border py-2.5 text-[12.5px]">
                <span className="text-text-3">{r.k}</span>
                <span className="font-semibold text-text-1">{r.v}</span>
              </div>
            ))}
        </div>
      )}

      {/* Action */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3">
        <button
          disabled={!amtOk || loadingBillerPayment}
          onClick={async () => {
            if (req.mode === "bill") {
              const finalAmount = Number(amount);
              const sessionId = String(flow.session_id || req.session_id || "").trim();
              const activeNum = String(flow.num || req.account || "").replace(/\D/g, "").trim();
              const opId = String(flow.operator || req.opId || "38").trim();
              const catType = String(flow.serviceType || req.categoryType || "DTH").trim();

              // Validation before fetchPaymentDetails
              if (!sessionId) {
                toast("Invalid session ID for current transaction.");
                console.error("fetchPaymentDetails blocked: Missing session_id", { flow, req });
                return;
              }
              if (!activeNum) {
                toast("Invalid subscriber/account number.");
                console.error("fetchPaymentDetails blocked: Missing subscriber/account number", { flow, req });
                return;
              }
              if (!opId) {
                toast("Invalid operator ID.");
                console.error("fetchPaymentDetails blocked: Missing operator ID", { flow, req });
                return;
              }
              if (!catType) {
                toast("Invalid service category type.");
                console.error("fetchPaymentDetails blocked: Missing serviceType", { flow, req });
                return;
              }
              if (!finalAmount || finalAmount <= 0) {
                toast("Payment amount must be greater than 0.");
                console.error("fetchPaymentDetails blocked: Amount <= 0", { amount: finalAmount });
                return;
              }

              setLoadingBillerPayment(true);
              try {
                const reqPayload = {
                  amount: finalAmount,
                  session_id: sessionId,
                  operator: opId,
                  number: activeNum,
                  type: catType,
                  circle: String(flow.circle || "14"),
                  field1: "", field2: "", field3: "", field4: "",
                  refresh: false, billDetails: "",
                  biometric_enabled: 0, is_key_active: 0,
                };
                console.log("Triggering fetchPaymentDetails API:", reqPayload);

                const response = await fetchPaymentDetails(reqPayload);

                flow.set({
                  amount: finalAmount,
                  billAmount: finalAmount,
                  session_id: sessionId,
                  num: activeNum,
                  operator: opId,
                  serviceType: catType,
                  paymentDetails: response,
                });

                router.push("/recharge/receipt");
              } catch (err) {
                console.error("fetchPaymentDetails Error on Proceed click:", err);
                toast(err?.message || "Unable to fetch payment details. Please try again.");
              } finally {
                setLoadingBillerPayment(false);
              }
            } else {
              if (short > 0) setUpiOpen(true);
              else setMpinOpen(true);
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 transition shadow-xs"
        >
          {loadingBillerPayment ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Fetching payment details...</span>
            </>
          ) : (
            <span>Proceed to Pay</span>
          )}
        </button>
      </div>

      <Sheet open={upiOpen} onClose={() => setUpiOpen(false)}>
        <div className="mb-3 font-display text-[15px] font-semibold">
          Add <span className="mono">Rs {inr(short)}</span> via UPI
        </div>
        {UPI_APPS.map((a) => (
          <button
            key={a.n}
            onClick={() => pickUpi(a.n)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-border bg-page px-3 py-2.5 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg font-display font-bold text-white" style={{ background: a.c, fontSize: a.a.length > 2 ? 8 : 11 }}>
              {a.a}
            </span>
            <span className="text-[13px] font-semibold">{a.n}</span>
          </button>
        ))}
        <div className="min-h-[18px] pt-1 text-center text-[12px] font-semibold text-text-2">{upiStatus}</div>
      </Sheet>

      <MpinSheet open={mpinOpen} onClose={() => setMpinOpen(false)} onComplete={(pin) => { setMpinOpen(false); finish(statusFromPin(pin), paidVia, walletPortion); }} />

      {showPlans && (
        <ViewPlan
          details={planDetailsData}
          onBack={() => setShowPlans(false)}
          onSelectPlan={handlePlanSelect}
        />
      )}
    </div>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="flex justify-between py-1 text-text-2">
      <span>{label}</span>
      <span className={`mono font-semibold ${accent ? "text-accent" : "text-text-1"}`}>{value}</span>
    </div>
  );
}
