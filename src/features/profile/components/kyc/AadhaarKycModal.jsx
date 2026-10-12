"use client";

import { useState, useEffect } from "react";
import { generateCaptcha, sendAadharOtp, verifyAadharOtp } from "@/features/profile/api";

export function AadhaarKycModal({ isOpen, onClose, onSuccess, initialStep = "input" }) {
  const [step, setStep] = useState(initialStep); // "input" | "otp"
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaData, setCaptchaData] = useState({ sessionId: "", code: "", img: "" });
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadCaptcha = async () => {
    setLoadingCaptcha(true);
    setErrorMsg("");
    try {
      const res = await generateCaptcha();
      const data = res?.data || res || {};
      setCaptchaData({
        sessionId: res?.session_id || data.session_id || data.captcha_id || "",
        img: res?.captcha_img || data.captcha_img || data.image || "",
        code: data.captcha_code || data.code || "",
      });
    } catch (err) {
      console.error("loadCaptcha error:", err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep("input");
      setErrorMsg("");
      setAadhaarNumber("");
      setCaptchaInput("");
      setAadhaarOtp("");
      loadCaptcha();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!aadhaarNumber || aadhaarNumber.length < 12) {
      setErrorMsg("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!captchaInput) {
      setErrorMsg("Please enter the captcha code");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await sendAadharOtp({
        aadhar_no: aadhaarNumber,
        captcha: captchaInput,
        session_id: captchaData.sessionId,
      });

      if (res?.success === 1 || res?.status === true || res?.session_id) {
        if (res?.session_id) {
          setCaptchaData((prev) => ({ ...prev, sessionId: res.session_id }));
        }
        setStep("otp");
      } else {
        setErrorMsg(res?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length < 4) {
      setErrorMsg("Please enter the valid OTP");
      return;
    }

    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await verifyAadharOtp({
        otp: aadhaarOtp,
        session_id: captchaData.sessionId,
      });

      if (res?.success === 1 || res?.status === true) {
        onSuccess(aadhaarNumber);
        onClose();
      } else {
        setErrorMsg(res?.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err?.message || "OTP verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[17px] font-bold text-text">
            {step === "input" ? "Aadhaar Verification" : "Verify Aadhaar OTP"}
          </h3>
          <button onClick={onClose} className="text-text-3 hover:text-text">✕</button>
        </div>

        <p className="mt-1 text-[13px] text-text-2">
          {step === "input"
            ? "Enter your 12-digit Aadhaar number and captcha to receive OTP"
            : "Enter 6-digit OTP sent to your Aadhaar registered mobile"}
        </p>

        {errorMsg && (
          <div className="mt-3 rounded-xl bg-accent-soft p-3 text-[12px] font-semibold text-accent">
            {errorMsg}
          </div>
        )}

        {step === "input" ? (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="text-[12px] font-bold text-text">Aadhaar Card Number</label>
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 12-digit Aadhaar"
                className="mt-1 w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] font-semibold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-[12px] font-bold text-text">Security Captcha</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-12 flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
                  {loadingCaptcha ? (
                    <span className="text-[12px] text-text-3">Loading captcha...</span>
                  ) : captchaData.img ? (
                    <img
                      src={captchaData.img.startsWith("data:") ? captchaData.img : `data:image/jpeg;base64,${captchaData.img}`}
                      alt="Security Captcha"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="font-mono text-[16px] font-bold tracking-widest text-violet">
                      {captchaData.code || ""}
                    </span>
                  )}
                </div>
                <button
                  onClick={loadCaptcha}
                  className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-border bg-surface-2 text-lg font-bold text-text-2 hover:bg-surface active:scale-95 transition"
                >
                  ↻
                </button>
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter captcha text"
                className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] font-semibold outline-none focus:border-primary"
              />
            </div>

            <button
              disabled={submitting}
              onClick={handleSendOtp}
              className="mt-3 w-full rounded-xl bg-primary py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
            >
              {submitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <input
              type="text"
              maxLength={6}
              value={aadhaarOtp}
              onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-center font-mono text-[18px] font-bold tracking-widest outline-none focus:border-primary"
            />

            <button
              disabled={submitting}
              onClick={handleVerifyOtp}
              className="mt-3 w-full rounded-xl bg-primary py-3 font-display text-[14px] font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition"
            >
              {submitting ? "Verifying..." : "Verify & Proceed"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
