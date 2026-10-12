"use client";

import { useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";

export default function TransactionHistory() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [bconnectTxnId, setBconnectTxnId] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <div className="min-h-screen bg-surface pb-8">
      <SubHeader title="Transaction History" backHref="/profile" />

      <div className="mx-auto mt-4 max-w-md space-y-5 px-4">
        {/* Field 1: Enter mobile number */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-text">
            Enter Mobile Number
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter mobile number"
            className="h-12 w-full rounded-full bg-gray-200/80 px-5 text-[14px] text-text-1 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Field 2: Select From Date */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-text">
            Select From Date
          </label>
          <input
            type="text"
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text";
            }}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From Date"
            className="h-12 w-full rounded-full bg-gray-200/80 px-5 text-[14px] text-text-1 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Field 3: Select To Date */}
        <div>
          <label className="mb-2 block text-[14px] font-medium text-text">
            Select To Date
          </label>
          <input
            type="text"
            onFocus={(e) => (e.target.type = "date")}
            onBlur={(e) => {
              if (!e.target.value) e.target.type = "text";
            }}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To Date"
            className="h-12 w-full rounded-full bg-gray-200/80 px-5 text-[14px] text-text-1 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Divider: and */}
        <div className="py-2 text-center text-[14px] font-medium text-gray-500">
          and
        </div>

        {/* Field 4: B-Connect TXN ID */}
        <div className="pt-2">
          <label className="mb-1 block text-[14px] font-medium text-text">
            B-Connect TXN ID:
          </label>
          <input
            type="text"
            value={bconnectTxnId}
            onChange={(e) => setBconnectTxnId(e.target.value)}
            placeholder="Enter B-Connect TXN ID"
            className="w-full border-b border-gray-400 bg-transparent py-2 px-1 text-[14px] text-text-1 outline-none placeholder:text-gray-400 focus:border-primary"
          />
        </div>

        {/* TRACK Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setShowConfirmation(true)}
            className="h-12 w-full rounded-lg bg-primary text-[14px] font-bold tracking-wider text-white transition active:scale-[0.98] shadow-sm hover:bg-[#5300d6]"
          >
            TRACK
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-[320px] rounded-xl bg-surface px-5 py-6 text-center shadow-xl">
            <h3 className="text-[16px] font-semibold text-text-1">
              Tracking Requested
            </h3>
            <p className="mt-3 text-[14px] leading-5 text-text-2">
              Your transaction search request has been submitted.
            </p>
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="mt-5 h-10 w-20 rounded-full bg-[#6200EE] text-[12px] font-semibold text-white shadow-sm transition active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
