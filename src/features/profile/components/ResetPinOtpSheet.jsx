"use client";

import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/lib/auth/store";
import { getOtpForMpinReset, fecthMpinResetByOtp } from "@/features/profile/api";

export function ResetPinOtpSheet({ open, onClose, mobile = "" }) {
  const toast = useToast((t) => t.show);

  const [otp, setOtp] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [otpToken, setOtpToken] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const initialOtpSentRef = useRef(false);

  const getActiveMobile =  Cookies.get("authMobile") || "";

  const resetForm = () => {
    setOtp("");
    setNewMpin("");
    setConfirmMpin("");
    setOtpToken("");
    setErr("");
    setLoading(false);
    setSendingOtp(false);
    initialOtpSentRef.current = false;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchOtp = async () => {
    setSendingOtp(true);
    setErr("");
    const userMobile = getActiveMobile;
    console.log("Fetching OTP for mobile:", userMobile);

    try {
      const res = await getOtpForMpinReset({ mobile: userMobile });
      const token = res?.otp_token || res?.data?.otp_token || res?.token || "";
      if (token) {
        setOtpToken(token);
      }
      const msg = res?.message || res?.msg || res?.data?.message || "OTP sent to your mobile number";
      toast(msg);
    } catch (error) {
      console.error("getOtpForMpinReset Error:", error);
      const errMsg = error?.data?.message || error?.message || "Failed to send OTP.";
      setErr(errMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    if (open && !initialOtpSentRef.current) {
      initialOtpSentRef.current = true;
      fetchOtp();
    }
  }, [open]);

  async function submit() {
    if (otp.length !== 6) {
      return setErr("Please enter the 6-digit OTP.");
    }
    if (newMpin.length !== 4 || confirmMpin.length !== 4) {
      return setErr("New MPIN and Confirmation must be 4 digits.");
    }
    if (newMpin !== confirmMpin) {
      return setErr("New MPIN and confirmation do not match.");
    }

    setErr("");
    setLoading(true);
    const userMobile = getActiveMobile;

    console.log("Submitting MPIN reset with OTP:", otp, "New MPIN:", newMpin, "OTP Token:", otpToken, "Mobile:", userMobile);

    try {
      const res = await fecthMpinResetByOtp({
        otp,
        new_mpin: newMpin,
        otp_token: otpToken,
        mobile: userMobile,
      });

      // const isSuccess =
      //   res?.success === true ||
      //   res?.success === 1 ||
      //   res?.status === true ||
      //   res?.status === "true" ||
      //   res?.status === 1;

      // const msg =
      //   res?.message ||
      //   res?.msg ||
      //   res?.data?.message ||
      //   (isSuccess ? "MPIN set successfully!" : "Failed to reset MPIN.");

      const isSuccess = res?.success === 1;

      const msg =
        res?.message ||
        (isSuccess ? "MPIN set successfully!" : "Failed to reset MPIN.");

      if (isSuccess) {
        toast(msg);
        resetForm();
        onClose();
      } else {
        setErr(msg);
      }
    } catch (error) {
      const errMsg =
        error?.data?.message || error?.message || "Failed to reset MPIN. Please try again.";
      setErr(errMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={handleClose}>
      <div className="space-y-4 pb-2">
        {/* Title */}
        <div className="text-center font-display text-[16px] font-bold text-text-1">
          Enter OTP
        </div>

        <div className="text-center space-y-1.5">
          <div className="text-[12px] font-medium text-text-3">
            OTP sent to your mobile number
          </div>
          <div className="relative max-w-[240px] mx-auto">
            <input
              value={otp}
              onChange={(e) => {
                setErr("");
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              inputMode="numeric"
              type="text"
              maxLength={6}
              placeholder="••••••"
              className="mono w-full rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3 text-center text-[18px] tracking-[0.5em] font-bold outline-none focus:border-primary shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-bold text-text-1">
            New M Pin
          </label>
          <input
            value={newMpin}
            onChange={(e) => {
              setErr("");
              setNewMpin(e.target.value.replace(/\D/g, "").slice(0, 4));
            }}
            inputMode="numeric"
            type="password"
            maxLength={4}
            placeholder="Enter New 4 digit M Pin"
            className="mono w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-bold text-text-1">
            Confirm M Pin
          </label>
          <input
            value={confirmMpin}
            onChange={(e) => {
              setErr("");
              setConfirmMpin(e.target.value.replace(/\D/g, "").slice(0, 4));
            }}
            inputMode="numeric"
            type="password"
            maxLength={4}
            placeholder="Confirm New M Pin"
            className="mono w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
          />
        </div>

        {err && (
          <div className="text-[11.5px] font-semibold text-rose-600">
            {err}
          </div>
        )}

        <button
          type="button"
          disabled={loading || otp.length !== 6 || newMpin.length !== 4 || confirmMpin.length !== 4}
          onClick={submit}
          className="w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[14px] font-bold text-white shadow-md transition active:scale-98 disabled:opacity-50"
        >
          {loading ? "Setting MPIN..." : "Set M Pin"}
        </button>
      </div>
    </Sheet>
  );
}
