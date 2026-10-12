"use client";
 
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecharge } from "../store";
import { fetchPaymentDetails } from "../api";
import { inr } from "@/utils/format";
import { resolveOperatorCircleInfo } from "../utils/operatorHelper";
import { Sheet } from "@/components/ui/Sheet";
import { PaymentSuccessful } from "@/components/ui/PaymentSuccessful";
 
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
        className="h-6 w-6 flex-none rounded-lg object-cover shadow-2xs"
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

export function ReceiptView() {
  const router = useRouter();
  const flow = useRecharge();
  const [useWallet, setUseWallet] = useState(true);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
  const [paymentDetailsError, setPaymentDetailsError] = useState("");
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);

  // Biller Customer Information Card visibility states
  const [showCustomerCard, setShowCustomerCard] = useState(false);
  const [expandedCustomerCard, setExpandedCustomerCard] = useState(false);

  const receipt = flow.receipt;
  const plan = flow.plan;
  const paymentDetails = flow.paymentDetails;
  const isBillerMode = flow.serviceType !== "Prepaid" || flow.mode === "bill";

  // 2. PRE-PAYMENT DETAILS VIEW (For Mobile Recharge and Billers) - Call ALL hooks top-level
  useEffect(() => {
    if (receipt || paymentDetails) {
      setLoadingPaymentDetails(false);
      return undefined;
    }

    const activeNumber = String(flow.num || flow.account || "").replace(/\D/g, "").trim();
    const sessionId = String(flow.session_id || flow.operatorPlanSessionId || "").trim();
    const opId = String(flow.operator || "").trim();
    const catType = String(flow.serviceType || flow.categoryType || "Prepaid").trim();
    const targetAmt = Number(flow.amount || flow.billAmount || plan?.rs || plan?.amt || 0);

    // Validation before fetchPaymentDetails call on ReceiptView mount
    if (!activeNumber || !sessionId || !opId || !catType || targetAmt <= 0) {
      setLoadingPaymentDetails(false);
      console.warn("ReceiptView fetchPaymentDetails skipped due to incomplete transaction state:", {
        activeNumber, sessionId, opId, catType, targetAmt
      });
      return undefined;
    }

    let active = true;

    async function loadPaymentDetails() {
      try {
        setLoadingPaymentDetails(true);
        setPaymentDetailsError("");
        const reqPayload = {
          amount: targetAmt,
          session_id: sessionId,
          operator: opId,
          number: activeNumber,
          type: catType,
          circle: String(flow.circle || "14"),
          field1: "", field2: "", field3: "", field4: "",
          refresh: false, billDetails: "",
          biometric_enabled: 0, is_key_active: 0,
        };
        console.log("ReceiptView getPaymentDetails request payload:", reqPayload);

        const response = await fetchPaymentDetails(reqPayload);
        if (active) flow.set({ paymentDetails: response, amount: targetAmt });
      } catch (error) {
        if (!active || error?.code === "SESSION_EXPIRED") return;
        setPaymentDetailsError(error?.message || "Unable to load payment details. Please try again.");
      } finally {
        if (active) setLoadingPaymentDetails(false);
      }
    }

    loadPaymentDetails();
    return () => {
      active = false;
    };
  }, [receipt, paymentDetails, plan, flow.num, flow.account, flow.session_id, flow.operatorPlanSessionId, flow.operator, flow.circle, flow.serviceType, flow.categoryType, flow.amount, flow.billAmount, flow.set]);

  console.log("response of the receiept view screnn",flow.paymentDetails)
  // 1. COMPLETED RECEIPT SCREEN (When transaction finishes from PayScreen)
  if (receipt) {
    const isSuccess = receipt.status === "success" || receipt.status === "processing";

    if (isSuccess) {
      return (
        <PaymentSuccessful
          receiptData={{
            ...receipt,
            operator: flow.operatorName || (typeof flow.operator === "object" ? flow.operator?.name : flow.operator),
            serviceType: flow.serviceType || flow.categoryType,
            account: flow.num || flow.account,
            customerName: flow.custName || flow.name,
          }}
          onClose={() => {
            flow.set({ receipt: null });
            router.replace("/");
          }}
        />
      );
    }

    return (
      <div className="min-h-screen bg-[#f4f5fa] pb-24 p-4 flex flex-col gap-4">
        {/* Status Header Banner */}
        <div className="flex flex-col items-center justify-center pt-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md bg-rose-500">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </span>

          <h2 className="mt-3 font-display text-[20px] font-bold text-text-1">
            Transaction Failed
          </h2>
          <div className="mono mt-1 text-[28px] font-extrabold text-text-1">
            Rs {inr(receipt.amount)}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-2xs">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-text-3">
            Transaction Details
          </div>
          {receipt.rows?.map((r) => (
            <div key={r.k} className="flex justify-between border-t border-border/50 py-2.5 text-[12.5px]">
              <span className="text-text-3">{r.k}</span>
              <span className={`font-semibold ${r.mono ? "mono" : ""} text-text-1`}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Home Button */}
        <button
          type="button"
          onClick={() => {
            flow.set({ receipt: null });
            router.replace("/");
          }}
          className="mt-2 w-full rounded-xl bg-primary py-3.5 font-display text-[14px] font-bold text-white shadow-xs active:scale-[0.985] transition"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (loadingPaymentDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f5fa] p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-[13px] font-medium text-text-2">Loading payment details...</span>
        </div>
      </div>
    );
  }

  if (paymentDetailsError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f5fa] p-6 text-center">
        <p className="text-[13px] font-medium text-text-2">{paymentDetailsError}</p>
        <button onClick={() => router.back()} className="rounded-xl bg-primary px-4 py-3 text-[13px] font-semibold text-white">
          Go back
        </button>
      </div>
    );
  }

  const details = paymentDetails?.data ?? paymentDetails ?? {};
  const amount = Number(details.amount ?? details.payable_amount ?? flow.billAmount ?? plan?.rs ?? plan?.amt ?? 0);

  const walletBalance = Number(
    details.wallet_balance ??
    flow.walletBalance ??
    flow.wallet?.balance ??
    850
  );

  const walletAmount = useWallet ? Math.min(amount, walletBalance) : 0;
  const payableAmount = Math.max(amount - walletAmount, 0);

  const activeNum = flow.num || flow.account || details.number || "-";

  // Resolve operator name, circle name, and operator logo
  const resolved = resolveOperatorCircleInfo(
    flow.operator || details.operator,
    flow.circle || details.circle
  );

  const descriptive = paymentDetails?.pg_split_payments?.description || "";

  const descriptionParts = descriptive.split(/(<b>.*?<\/b>)/g);
  const operator = flow.operatorName || details.operator_name || resolved.operatorName || (flow.serviceType || flow.categoryType || "Prepaid");
  const circle = flow.circleName || details.circle_name || resolved.circleName || "India";
  const logo = flow.operatorLogo || resolved.operatorLogo;

  const rawBilldata = flow.billdata || {};
  const custName = rawBilldata["Customer Name"] || flow.custName || null;
  const subtitleText = custName ? custName : `${operator} · ${circle} · ${flow.serviceType || "Prepaid"}`;

  const planAmount = Number(plan?.rs || plan?.amt || amount || 0);
  const perDayCost = plan ? (plan.per_day_cost || (planAmount / Number(plan.validity || plan.val || 28)).toFixed(1)) : 0;
  const dailyPrice = Number(perDayCost);
  
  const validity = plan?.validity || plan?.val || plan?.validityDays || "-";
  const data = plan?.data || plan?.dataBenefit || "-";
  const calls = plan?.calls || plan?.voice || "-";
  const sms = plan?.sms || "-";
  const description = plan?.description || plan?.desc || "";
  const additionalBenefits = plan?.additional_benefits || [];

  // Filter non-empty billdata rows
  const validBilldataRows = [];
  Object.entries(rawBilldata).forEach(([k, v]) => {
    if (v !== null && v !== undefined && String(v).trim() !== "") {
      validBilldataRows.push({ k, v: String(v).trim() });
    }
  });

  const handlePayment = () => {
    const txnId = `RC${Date.now().toString().slice(-9)}`;
    const bConnectTxnId = `CC01${Date.now().toString().slice(-10)}`;
    const finalAmount = amount > 0 ? amount : 100;
    const paidViaStr = useWallet ? "UPI" : "UPI";

    flow.set({
      receipt: {
        status: "success",
        amount: finalAmount,
        paidVia: paidViaStr,
        via: paidViaStr,
        bConnectTxnId: bConnectTxnId,
        billerId: "BL1094852",
        billerName: operator,
        operator: operator,
        category: flow.serviceType || "DTH Recharge",
        account: activeNum,
        customerName: custName || "RAJESH KUMAR",
        customerNumber: activeNum,
        billDate: "01/09/2026",
        billPeriod: "Monthly",
        billNumber: "BL-9485721",
        dueDate: "15/09/2026",
        convenienceFee: "Rs 0.00",
        billAmount: finalAmount,
        totalAmount: finalAmount,
        logo:logo,
        dateTime: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
        // initiatingChannel: "Agent App",
        rows: [
          { k: "Operator", v: operator },
          { k: "Category", v: flow.serviceType || "Recharge" },
          { k: "Account", v: activeNum, mono: true },
          { k: "Customer", v: custName || "RAJESH KUMAR" },
          { k: "Paid via", v: paidViaStr },
          { k: "Date & time", v: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) },
          { k: "Txn ID", v: txnId, mono: true },
        ],
      },
    });
  };

  


  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5fa] pb-24 text-text-1">
      {/* FIXED HEADER */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-primary px-4 py-3 shadow-2xs">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface shadow-2xs transition active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-primary" aria-hidden="true">
            <path d="M15.5 4.5 8 12l7.5 7.5-1.8 1.8L4.4 12l9.3-9.3Z" />
          </svg>
        </button>
        <h1 className="font-display text-[16px] font-semibold text-white">Payment Details</h1>
        <img src="/bharat-connect-reverse-logo.png" alt="Bharat Connect" className="h-[2.55rem] ml-auto object-containn" />

      </div>

      {/* MIDDLE SCROLLABLE CONTENT */}
      <div className="flex flex-col gap-3 p-4">
        {/* Operator & Customer Header Card */}
        <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={operator}
                className="h-10 w-10 flex-none rounded-full border border-border bg-page object-cover shadow-xs"
                onError={(e) => {
                  e.target.style.display = "none";
                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary font-display text-[12px] font-bold text-white shadow-xs"
              style={{ display: logo ? "none" : "flex" }}
            >
              {operator !== "-" ? operator.slice(0, 2).toUpperCase() : "EG"}
            </span>

            <div className="min-w-0 flex-1">
               <div className="mt-0.5 text-[13.5px] font-bold text-text-1">
                {subtitleText ? subtitleText : operator}
              </div>
              <div className="text-[11.5px] font-medium text-text-3">
                <span className="">{activeNum } </span>
                <span className=" "> {subtitleText? "":operator}</span>
              </div>
            </div>

            {/* SEE DETAILS / HIDE DETAILS TOGGLE BUTTON */}
            {isBillerMode ? (
              <button
                type="button"
                onClick={() => setShowCustomerCard((prev) => !prev)}
                className="min-w-0 flex justify-center items-center cursor-pointer active:scale-95 transition"
              >
                <span className="text-[12.5px] text-primary font-bold">
                  {showCustomerCard ? "Hide Details" : "See Details"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setDetailsSheetOpen(true)}
                className="min-w-0 flex justify-center items-center cursor-pointer active:scale-95 transition"
              >
                <span className="text-[12.5px] text-primary font-bold">See Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Plan / Bill Amount */}
        <div className="pt-7 text-center">
          <div className="mono text-[42px] font-semibold leading-none text-[#111827]">
            Rs {inr(amount)}
          </div>
          {dailyPrice > 0 && (
            <div className="mt-2 text-[13px] font-medium text-text-3">
              Rs {dailyPrice}/day
            </div>
          )}
        </div>

        {/* Ledger Balance Card */}
        {details?.show_ledger === true && (
          <div className="mt-1 flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9ebff]">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#1018ff]">
                  <path d="M20 7h-1V5a2 2 0 0 0-2-2H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V9a2 2 0 0 0-2-2ZM5 5h12v2H5a1 1 0 1 1 0-2Zm14 13H5a1 1 0 0 1-1-1V9h15v9Zm-2-3h3v-2h-3a1 1 0 0 0 0 2Z" />
                </svg>
              </div>

              <div>
                <div className="text-[13px] font-medium text-text-3">Available Balance</div>
                <div className="mono mt-0.5 text-[13px] font-semibold text-text-1">Rs {details?.ledger_amount}</div>
                <div className="text-text-3 font-small text-[12px]">{details?.message}</div>
              </div>

            </div>

            <button
              type="button"
              onClick={() => setUseWallet((prev) => !prev)}
              aria-label="Use wallet balance"
              className={`relative h-7 w-[47px] rounded-full transition ${
                useWallet ? "bg-[#1018ff]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition ${
                  useWallet ? "left-[25px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        )}

        {/* BILLER CUSTOMER INFORMATION CARD (Visible ABOVE Payment Breakdown when isBillerMode and showCustomerCard is true) */}
        {isBillerMode && showCustomerCard && validBilldataRows.length > 0 && (
          <div className="mt-1 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
            <div className="flex items-center gap-2 pb-2.5 text-[13px] font-bold text-text-1 border-b border-border/40">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-primary">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              Customer Information
            </div>

            {/* Key Summary 2x2 Grid for first 4 entries */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 text-[12px]">
              {validBilldataRows.slice(0, 4).map((r) => (
                <div key={r.k} className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-text-3 truncate">{r.k}</div>
                  <div className="mt-0.5 font-bold text-text-1 truncate">{r.v}</div>
                </div>
              ))}
            </div>

            {/* Expanded Extra Fields */} 
            {expandedCustomerCard && validBilldataRows.length > 4 && (
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 text-[12px]">
                {validBilldataRows.slice(4).map((r) => (
                  <div key={r.k} className="min-w-0">
                    <div className="text-text-3">{r.k}</div>
                    <div className="font-semibold text-text-1 ">{r.v}</div>
                  </div>
                ))}
              </div>
            )}

            {/* See More / See Less Toggle Link (Only if > 4 items) */}
            {validBilldataRows.length > 4 && (
              <div className="mt-3 text-center border-t border-border/40 pt-2">
                <button
                  type="button"
                  onClick={() => setExpandedCustomerCard((prev) => !prev)}
                  className="text-[12px] font-bold text-primary active:scale-95 transition"
                >
                  {expandedCustomerCard ? "See less" : "See more"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* FULL PAYMENT SUMMARY CARD (Payment Breakdown) */}
        <div className="mt-1 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-xs">
          <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-text-3">
            Payment Breakdown
          </div>

          <div className="flex items-center justify-between py-1.5 text-[13px]">
            <span className="text-text-3">Recharge amount</span>
            <span className="mono font-medium text-text-1">Rs {inr(amount)}</span>
          </div>
          {/* 
          {useWallet && (
            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-text-3">Paid from UPI</span>
              <span className="mono font-medium text-text-1">Rs {inr(walletAmount)}</span>
            </div>
          )} */}

          {/* Convenience Charge Fee (CCF) */}
          <div className="flex items-center justify-between py-1.5 text-[13px]">
            <span className="text-text-3">{details?.ccf_title || "Convenience fee"}</span>
            {Number(details?.ccf) > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="mono font-medium text-text-1">Rs {details?.ccf}</span>
                {details?.ccf_msg && (
                  <div className="group relative">
                    <span className="flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-full border border-text-3 text-[10px] font-bold text-text-3">
                      i
                    </span>
                    <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden w-52 rounded-lg bg-gray-700 px-3 py-2 text-[11px] leading-relaxed text-white shadow-lg group-hover:block">
                      {details?.ccf_msg}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span className="font-medium text-green-600">Free</span>
            )}
          </div>

          {/* Cashback discount */}
          {details?.cashback_discount>0 && (
            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-text-3">Cashback discount</span>
              <span className="mono font-medium text-text-1">Rs {details?.cashback_discount}</span>
            </div>
          )}

          {!useWallet && (
            <div className="flex items-center justify-between py-1.5 text-[13px]">
              <span className="text-text-3">Amount to add</span>
              <span className="mono font-medium text-red-500">Rs {inr(amount)}</span>
            </div>
          )}

          <div className="my-1 border-t border-dashed border-border" />

          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13.5px] font-bold text-text-1">
              {useWallet ? "Amount to be paid" : "Total payable"}
            </span>
            <span className="mono text-[14px] font-bold text-text-1">
              Rs {inr(details?.total_payable || amount)}
            </span>
          </div>
        </div>

          {/* Avoid UPI Charges Card */}
          <div className="mt-3 rounded-2xl border border-amber-300 bg-[#FFF9E6] p-3.5 shadow-xs">
            {/* Top Banner Header */}
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-500 font-bold text-white text-[13px] shadow-xs mt-0.5">
                !
              </div>
              <div>
              <div
                className="text-[13.5px] font-bold"
                dangerouslySetInnerHTML={{
                  __html: paymentDetails?.pg_split_payments?.title || "",
                }}
              />
              <p className="mt-0.5 text-[12px] leading-snug text-[#BA893C]">
                {descriptionParts.map((part, index) =>
                  part.startsWith("<b>") ? (
                    <strong key={index} className="font-bold text-gray-900">
                      {part.replace(/<\/?b>/g, "")}
                    </strong>
                  ) : (
                    part
                  )
                )}
              </p>
              </div>
            </div>

            {/* Inner White Card */}
            <div className="mt-3 rounded-xl border border-amber-200/60 bg-white p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-gray-800">
                <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-gray-700 fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>How your payment gets split</span>
              </div>

            <div className="mt-2.5 space-y-2 text-[12.5px]">
              {paymentDetails?.pg_split_payments?.payments?.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium text-gray-600">
                    {payment.title}
                  </span>

                  <span className="mono font-semibold text-gray-900">
                    {payment.value}
                  </span>
                </div>
              ))}
            </div>

            {paymentDetails?.pg_split_payments?.savings && (
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-green-50 px-2.5 py-1.5 text-[12px]">
                <span className="flex items-center gap-1 font-semibold text-green-700">
                  {paymentDetails.pg_split_payments.savings.title}
                </span>

                <span className="font-bold text-green-700">
                  {paymentDetails.pg_split_payments.savings.value}
                </span>
              </div>
            )}
            </div>

            {/* Action Button */}
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-3 text-[13px] font-bold text-white shadow-md active:scale-[0.985] transition"
            >
            <svg
              width="22"
              height="22"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="14"
                cy="14"
                r="12"
                stroke="white"
                strokeWidth="2"
              />
              <path
                d="M14 9V19M9 14H19"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
              <span>{paymentDetails?.pg_split_payments?.button_text}</span>
            </button>
          </div>
      </div>

      {/* Bottom Payment Button */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3 shadow-lg">
        <button
          type="button"
          onClick={handlePayment}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100 transition shadow-xs"
        >
          <span>Proceed to pay</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        </button>
      </div>

      {/* MOBILE PLAN BENEFITS SHEET MODAL ON "SEE DETAILS" CLICK (ONLY FOR MOBILE RECHARGE) */}
      {!isBillerMode && (
        <Sheet open={detailsSheetOpen} onClose={() => setDetailsSheetOpen(false)}>
          <div className="flex max-h-[50vh] flex-col overflow-hidden">
            <div className="flex flex-none items-center justify-between pb-3 border-b border-border/40">
              <span className="mono font-display text-[26px] font-extrabold text-text-1">
                Rs {inr(planAmount)}
              </span>
              {dailyPrice > 0 && (
                <span className="rounded-full bg-primary-soft px-3 py-1 text-[12px] font-bold text-primary">
                  Rs {dailyPrice}/day
                </span>
              )}
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar py-3.5 flex flex-col gap-4">
              <div className="grid grid-cols-4 divide-x divide-border rounded-xl bg-page/50 py-2.5 text-center">
                <div className="px-1 min-w-0">
                  <div className="text-[10px] leading-tight break-words min-h-[24px] font-extrabold text-text-1">{calls}</div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">Calls</div>
                </div>
                <div className="px-1 min-w-0">
                  <div className="break-words min-h-[24px] text-[10px] leading-tight font-extrabold text-text-1">{sms}</div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">SMS</div>
                </div>
                <div className="px-1 min-w-0">
                  <div className="text-[10px] font-extrabold text-text-1 break-words leading-tight min-h-[24px]">{data}</div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">Data</div>
                </div>
                <div className="px-1 min-w-0">
                  <div className="text-[10px] font-extrabold text-text-1 break-words leading-tight min-h-[24px]">{validity}</div>
                  <div className="mt-0.5 text-[10.5px] font-medium text-text-3">Validity</div>
                </div>
              </div>

              {description && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-3">Description</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-2 whitespace-pre-line">{description}</p>
                </div>
              )}

              {additionalBenefits.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-text-3">Additional Benefits</div>
                  <div className="mt-2 flex flex-col divide-y divide-border">
                    {additionalBenefits.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        <BenefitAvatar item={b} index={bIdx} />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[13px] font-bold text-text-1">{b.title}</span>
                          {b.description && (
                            <span className="block text-[11.5px] font-medium text-text-3">{b.description}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
