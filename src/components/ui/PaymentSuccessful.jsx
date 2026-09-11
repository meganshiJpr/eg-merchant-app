"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { inr } from "@/utils/format";



function playSuccessSound() {
  try {
    const audio = new Audio("/BharatConnect MOGO® 270824.mp3");
    audio.play().catch(() => {});
  } catch {}
}

function formatRequestTime(reqTime) {
  if (!reqTime) return null;
  let dateObj;
  const num = Number(reqTime);
  if (!isNaN(num) && num > 0) {
    dateObj = new Date(num > 1e11 ? num : num * 1000);
  } else {
    dateObj = new Date(reqTime);
  }

  if (isNaN(dateObj.getTime())) return String(reqTime);

  const day = dateObj.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

export function PaymentSuccessful({ receiptData, onClose, playSound = true }) {
  const router = useRouter();
  const [animated, setAnimated] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    setAnimated(true);
    if (playSound && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playSuccessSound();
    }
  }, [playSound]);
  

  const rawAmount = Number(receiptData?.amount || receiptData?.totalAmount || 0);
  const formattedAmount = rawAmount > 0 ? inr(rawAmount) : "N/A";
  const finalCharge = receiptData?.final_charge ? Number(receiptData.final_charge) : 0;

  const apiDiscount = receiptData?.discount
    ? Number(receiptData.discount)
    : receiptData?.commission
      ? Number(receiptData.commission)
      : 0;

  const discount = apiDiscount > 0
    ? apiDiscount
    : (rawAmount > 0 && finalCharge > 0 && rawAmount > finalCharge)
      ? (rawAmount - finalCharge)
      : 0;

  // initial cards empty
  const card1Rows = [];
  const card2Rows = [];

  const addRow = (cardTarget, label, val, opts = {}) => {
    if (
      val !== null &&
      val !== undefined &&
      String(val).trim() !== "" &&
      String(val).trim() !== "null" &&
      String(val).trim() !== "undefined"
    ) {
      if (cardTarget === 1) {
        card1Rows.push({ label, value: String(val).trim(), ...opts });
      } else {
        card2Rows.push({ label, value: String(val).trim(), ...opts });
      }
    }
  };

  // Dynamic field mappings from API response or receipt object
  const txnId = receiptData?.order_id || receiptData?.bConnectTxnId || receiptData?.support_text;

  // card1
  addRow(1, "Customer Name", receiptData?.customerInfo?.["Customer Name"] || receiptData?.customerName || receiptData?.custName, { bold: true });
  addRow(1, "Order Id", receiptData?.order_id, { mono: true });
  addRow(1, "Biller Name", receiptData?.operator_name || receiptData?.billerName || receiptData?.operator, { bold: true });
  addRow(1, "Category", receiptData?.recharge_type || receiptData?.category || receiptData?.serviceType);
  addRow(1, "Due Date", receiptData?.dueDate);
  addRow(1, "Bill Date", receiptData?.billDate);
  addRow(1, "Bill Period", receiptData?.billPeriod);
  addRow(1, "Bill Number", receiptData?.billNumber, { mono: true });
  addRow(1, "Payment Mode", receiptData?.paidVia || receiptData?.paymentMode, { bold: true });
  addRow(1, "Transaction Amount", rawAmount > 0 ? `₹${formattedAmount}` : null, { mono: true, bold: true });
  addRow(1, "CCF", receiptData?.convenienceFee);

  // card2
  addRow(2, "Amount Debited", finalCharge > 0 ? `₹${inr(finalCharge)}` : (rawAmount > 0 ? `₹${formattedAmount}` : null), { mono: true, bold: true });
  addRow(2, "Discount", discount > 0 ? `₹${inr(discount)}` : null, { mono: true });
  addRow(2, "Total Amount", receiptData?.totalAmount ? `₹${inr(Number(receiptData.totalAmount))}` : null, { mono: true });
  addRow(2, "Initiating Channel", receiptData?.initiatingChannel);
  // addRow(2, "Transaction Status", receiptData?.status ? String(receiptData.status).toUpperCase() : null, { statusGreen: true });

  // Dynamically include any additional customerInfo properties if present
  if (receiptData?.customerInfo && typeof receiptData.customerInfo === "object") {
    Object.entries(receiptData.customerInfo).forEach(([k, v]) => {
      if (k !== "Customer Name") {
        addRow(1, k, v);
      }
    });
  }

  // Also include any raw custom rows if passed
  if (Array.isArray(receiptData?.rows)) {
    receiptData.rows.forEach((r) => {
      if (r?.k && r?.v) {
        const lowerK = r.k.toLowerCase();
        const existsInC1 = card1Rows.some((existing) => existing.label.toLowerCase() === lowerK);
        const existsInC2 = card2Rows.some((existing) => existing.label.toLowerCase() === lowerK);
        if (!existsInC1 && !existsInC2) {
          if (lowerK.includes("discount") || lowerK.includes("debit") || lowerK.includes("charge") || lowerK.includes("status")) {
            addRow(2, r.k, r.v, { mono: r.mono });
          } else {
            addRow(1, r.k, r.v, { mono: r.mono });
          }
        }
      }
    });
  }

  // const logoUrl =
  //   receiptData?.logo_path && receiptData?.logo
  //     ? `${receiptData.logo_path}/${receiptData.logo}`
  //     : "/B-assured-logo.png";

  const statusStr = String(receiptData?.status || "SUCCESSFUL").toUpperCase();
  const customerNameStr = receiptData?.customerInfo?.["Customer Name"] || receiptData?.customerName || receiptData?.custName || "N/A";
  const customerNumStr = receiptData?.number || receiptData?.account || "N/A";

  const handleShare = async () => {
    const summary = `Payment Receipt\nStatus: ${statusStr}\nAmount: Rs ${formattedAmount}\nTxn ID: ${txnId || "N/A"}\nCustomer: ${customerNameStr}\nAccount: ${customerNumStr}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Payment Receipt", text: summary });
        return;
      } catch {}
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(summary);
      alert("Receipt details copied to clipboard!");
    }
  };

  const handleDone = () => {
    if (onClose) onClose();
    else router.replace("/");
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f5fa] max-w-app mx-auto text-text-1 pb-24 shadow-2xl">
      {/* 1. HEADER WITH RECEIPT TITLE & BHARAT ASSURED LOGO */}
      <div className="sticky top-0 z-30 flex items-center border-b border-border bg-surface px-4 py-3 shadow-2xs">
        <button
          type="button"
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-text-3 hover:bg-muted"
          aria-label="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display text-[16px] font-bold text-text-1 pl-5">Receipt</h1>
        {
          receiptData?.is_bbps_service === true && (
            <div className="ml-auto">
          <img src="/B-assured-logo.png" alt="Bharat Connect" className="h-10 object-contain" />
        </div>
          )
        }
        
      </div>

      {/* 2. SUCCESS HEADER & ANIMATED GREEN TICK */}
      <div className="flex flex-col items-center justify-center pb-4 text-center px-4 mt-4">
        {/* Animated Green Tick Circle */}
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full text-emerald-600 shadow-sm transition-all duration-700 ease-out transform`}
        >
          <img
            src={`${receiptData?.logo_path}/${receiptData?.logo}`}
            alt="Operator Logo"
            className=" rounded-full object-contain"
          />
        </div>
          {/* <div className="mono text-[13px] text-text-2 font-semibold tracking-tight mt-1">
            {receiptData?.operator_name}
          </div> */}
      <div className="flex flex-row items-center justify-center gap-2">
        <h2 className="mt-3 font-display text-[20px] font-bold text-emerald-600 tracking-tight">
          Payment {statusStr}
        </h2>
        <span className="rounded-full bg-emerald-100/80 text-emerald-600 p-1.5 mt-2">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"> <path d="M5 13l4 4L19 7" /> </svg>
        </span>
        </div>

        {/* Large Total Amount */}
        <div className="mono text-[32px] font-extrabold text-text-1 tracking-tight">
          Rs {formattedAmount}
        </div>
        <div className="mono text-[13px] text-text-2 tracking-tight">
          {formatRequestTime(receiptData?.request_time)}
        </div>
        <div className="mono text-[12px] text-text-3 tracking-tight mt-1">
         {receiptData?.number}
        </div>
        <div className="text-[11px] text-text-3 mt-1">
          {receiptData?.support_text} {receiptData?.operator_ref}
        </div>
      </div>

      {/* 3. DYNAMIC 2-CARD SPLIT DETAILS */}
      <div className="px-4 space-y-3">
        {/* CARD 1: MAIN DETAILS (Customer, Bill, Due Date, Payment Mode, CCF) */}
        {card1Rows.length > 0 && (
          <div className="rounded-2xl border border-border/80 bg-surface px-4 py-3 shadow-2xs divide-y divide-border/50">
            {card1Rows.map((r, i) => (
              <Row key={i} label={r.label} value={r.value} mono={r.mono} bold={r.bold} statusGreen={r.statusGreen} />
            ))}
          </div>
        )}

        {/* CARD 2: CHARGES & STATUS DETAILS (Amount Debited, Discount, Status) */}
        {card2Rows.length > 0 && (
          <div className="rounded-2xl border border-border/80 bg-surface px-4 py-3 shadow-2xs divide-y divide-border/50">
            {card2Rows.map((r, i) => (
              <Row key={i} label={r.label} value={r.value} mono={r.mono} bold={r.bold} statusGreen={r.statusGreen} />
            ))}
          </div>
        )}

        {card1Rows.length === 0 && card2Rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-4 text-center text-[13px] text-text-3">
            No additional transaction details available.
          </div>
        )}
      </div>

      {/* 4. BOTTOM STICKY ACTION BUTTONS */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3 shadow-lg flex items-center gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 rounded-xl border border-border bg-surface py-3.5 font-display text-[14px] font-bold text-text-1 shadow-2xs active:scale-[0.985] transition text-center"
        >
          Download Receipt
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="flex-1 rounded-xl bg-[#0112FE] py-3.5 font-display text-[14px] font-bold text-white shadow-md active:scale-[0.985] transition text-center"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono, bold, statusGreen }) {
  return (
    <div className="flex justify-between items-center py-2.5 text-[12.5px]">
      <span className="text-text-3 font-medium">{label}</span>
      <span
        className={`text-right ${mono ? "mono font-semibold" : ""} ${bold ? "font-bold text-text-1" : "font-semibold text-text-1"} ${
          statusGreen ? "font-bold text-emerald-600" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
