"use client";

import { useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";

const complaintDispositions = [
  "Transaction Successful, Amount Debited but services not received",
  "Transaction Successful, Amount Debited but Service Disconnected or Service Stopped",
  "Transaction Successful, Amount Debited but Late Payment Surcharge Charges added in next bill",
  "Erroneously paid in wrong account",
  "Duplicate Payment",
  "Erroneously paid the wrong amount",
  "Payment information not received from Biller or Delay in receiving payment information from the Biller",
  "Bill Paid but Amount not adjusted or still showing due amount",
];

export default function ComplaintRegistration() {
  const [mode, setMode] = useState("register");
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <>
    <SubHeader title="Complaint Registration" backHref="/profile" />
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">

      <div className="my-4 border-t border-border" />

      {/* Radio Options */}
      <div className="flex items-center gap-6">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="complaintMode"
            value="register"
            checked={mode === "register"}
            onChange={() => setMode("register")}
            className="h-5 w-5 accent-primary"
          />

          <span className="text-[14px] text-text-2">
            Registration
          </span>
        </label>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="complaintMode"
            value="track"
            checked={mode === "track"}
            onChange={() => setMode("track")}
            className="h-5 w-5 accent-primary"
          />

          <span className="text-[14px] text-text-2">
            Tracking
          </span>
        </label>
      </div>

      {/* Form */}
      <div className="mt-6 space-y-4">
        {mode === "register" ? (
         <>
            {/* B-Connect TXN ID */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-text">
                B-Connect TXN ID
              </label>

              <input
                type="text"
                placeholder="B-Connect TXN ID"
                className="h-12 w-full rounded-xl border border-border bg-page px-4 text-[14px] text-text outline-none focus:border-primary"
              />
            </div>

            {/* OR */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[12px] font-medium text-text-3">
                OR
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-text">
                Mobile Number
              </label>

              <input
                type="tel"
                placeholder="Mobile Number"
                className="h-12 w-full rounded-xl border border-border bg-page px-4 text-[14px] text-text outline-none focus:border-primary"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-row-2 gap-3">
              <div>
                <label className="mb-2 block text-[14px] font-semibold text-text">
                  Start Date
                </label>

                <input
                  type="date"
                  className="h-12 w-[22.3rem] sm:w-full bg-page rounded-xl border border-border px-3 text-[13px] text-text outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-semibold text-text">
                  End Date
                </label>

                <input
                  type="date"
                  className="h-12 w-[22.3rem] sm:w-full rounded-xl border border-border bg-page px-3 text-[13px] text-text outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Complaint Disposition */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-text">
                Complaint Disposition
              </label>

                 <select
                   className="w-full max-w-full rounded-xl border border-border bg-page px-4 py-3 text-[14px] text-text-2 outline-none focus:border-primary"
                  defaultValue=""
                    >
                 <option value="" disabled>
                   Complaint Disposition
                  </option>

                  {complaintDispositions.map((item) => (
                <option key={item} value={item}>
                {item}
             </option>
                ))}
             </select>                                         
            </div>

            {/* Complaint Description */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-text">
                Complaint Description
              </label>

              <textarea
                placeholder="Complaint Description"
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-page px-4 py-3 text-[14px] text-text outline-none focus:border-primary"
              />
            </div>
          </>
        ) : (
          <>
            {/* Transaction Ref ID */}
            <div>
              <label className="mb-2 block text-[14px] font-semibold text-text">
                 Reference Id
              </label>

              <input
                type="text"
                placeholder="Enter Complaint Id"
                className="h-12 w-full rounded-xl border border-border bg-page px-4 text-[14px] text-text outline-none transition focus:border-primary"
              />
            </div>  
            
          </>
        )}

        {/* Submit */}
        <button
          type="button"
           onClick={() => setShowConfirmation(true)}
          className="h-12 w-full rounded-xl bg-primary text-[14px] font-semibold text-white transition active:scale-[0.98]"
        >
          {mode === "register" ? "Submit Complaint" : "Track Complaint"}
        </button>
      </div>
      {showConfirmation && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-[320px] rounded-xl bg-surface px-5 py-6 text-center shadow-xl">

      {/* Title */}
      <h3 className="text-[16px] font-semibold text-text">
        Registered
      </h3>

      {/* Message */}
      <p className="mt-3 text-[14px] leading-5 text-text-2">
        Your Complaint has been registered successfully.
        Your complaint Id is{" "}
        <span className="font-semibold text-text">
          CC1234321321
        </span>
        . To track your registered complaint you can use complaint id.
      </p>

      {/* OK Button */}
      <button
        type="button"
        onClick={() => setShowConfirmation(false)}
        className="mt-5 h-10 w-20 rounded-full bg-primary text-[12px] font-semibold text-white shadow-sm transition active:scale-95"
      >
        OK
      </button>
    </div>
  </div>
)}
    </div>
    </>
  );
  
}
