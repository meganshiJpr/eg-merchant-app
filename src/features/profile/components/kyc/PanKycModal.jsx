"use client";

import { useState, useEffect } from "react";
import { verifyPan } from "@/features/profile/api";

export function PanKycModal({ isOpen, onClose, onSuccess }) {
  const [panNumber, setPanNumber] = useState("");
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPanNumber("");
      setDob("");
      setErrorMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyPan = async () => {
    if (!panNumber || panNumber.length < 10) {
      setErrorMsg("Please enter a valid 10-character PAN number");
      return;
    }
    if (!dob) {
      setErrorMsg("Please enter your Date of Birth");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await verifyPan({
        pan: panNumber.toUpperCase(),
        dob,
      });

      if (res?.success === 1 || res?.status === true) {
        onSuccess(panNumber.toUpperCase());
        onClose();
      } else {
        setErrorMsg(res?.message || "PAN verification failed. Please check details.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "PAN verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[17px] font-bold text-text">PAN Card Verification</h3>
          <button onClick={onClose} className="text-text-3 hover:text-text">✕</button>
        </div>
        <p className="mt-1 text-[13px] text-text-2">Enter your 10-character PAN number and date of birth</p>

        {errorMsg && (
          <div className="mt-3 rounded-xl bg-accent-soft p-3 text-[12px] font-semibold text-accent">
            {errorMsg}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-[12px] font-bold text-text">PAN Card Number</label>
            <input
              type="text"
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="e.g. ABCDE1234F"
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 uppercase font-mono text-[14px] font-bold outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-text">Date of Birth (DOB)</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] font-semibold outline-none focus:border-primary"
            />
          </div>

          <button
            disabled={submitting}
            onClick={handleVerifyPan}
            className="mt-3 w-full rounded-xl bg-primary py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
          >
            {submitting ? "Verifying PAN..." : "Verify PAN"}
          </button>
        </div>
      </div>
    </div>
  );
}
