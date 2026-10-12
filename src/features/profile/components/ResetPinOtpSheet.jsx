"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { getOtpForMpinReset, fetchMpinResetByOtp } from "@/features/profile/api";

export function ResetPinOtpSheet({ open, onClose, mobile = "" }) {
  const { t } = useTranslation(["profile", "common"]);
  const toast = useToast((t) => t.show);

  const [otp, setOtp] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [otpToken, setOtpToken] = useState("");

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const getActiveMobile = Cookies.get("authMobile") || "";

  const resetForm = () => {
    setOtp("");
    setNewMpin("");
    setConfirmMpin("");
    setOtpToken("");
    setErr("");
    setLoading(false);
    setSendingOtp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fetchOtp = async () => {
    setSendingOtp(true);
    setErr("");
    const userMobile = getActiveMobile;

    try {
      const res = await getOtpForMpinReset({ mobile: userMobile });
      const token = res?.otp_token || res?.data?.otp_token || res?.token || "";
      if (token) {
        setOtpToken(token);
      }
      const msg = res?.message || res?.msg || res?.data?.message || t("profile:resetPin.otpSentSubtitle");
      toast(msg);
    } catch (error) {
      console.error("getOtpForMpinReset Error:", error);
      const errMsg = error?.data?.message || error?.message || t("common:error");
      setErr(errMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  async function submit() {
    if (otp.length !== 6) {
      return setErr(t("profile:resetPin.errOtpLength"));
    }
    if (newMpin.length !== 4 || confirmMpin.length !== 4) {
      return setErr(t("profile:changePin.errLength"));
    }
    if (newMpin !== confirmMpin) {
      return setErr(t("profile:changePin.errMismatch"));
    }

    setErr("");
    setLoading(true);
    const userMobile = getActiveMobile;

    try {
      const res = await fetchMpinResetByOtp({
        otp,
        new_mpin: newMpin,
        otp_token: otpToken,
        mobile: userMobile,
      });

      const isSuccess = res?.success === 1;

      const msg =
        res?.message ||
        (isSuccess ? t("profile:resetPin.successMsg", "MPIN set successfully!") : t("profile:resetPin.errMsg", "Failed to reset MPIN."));

      if (isSuccess) {
        toast(msg);
        resetForm();
        onClose();
      } else {
        setErr(msg);
      }
    } catch (error) {
      const errMsg =
        error?.data?.message || error?.message || t("profile:resetPin.errMsg", "Failed to reset MPIN. Please try again.");
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
          {t("profile:resetPin.title")}
        </div>

        <div className="text-center space-y-1.5">
          <div className="text-[12px] font-medium text-text-3">
            {t("profile:resetPin.otpSentSubtitle")}
          </div>
          
          <div className="mx-auto flex max-w-[360px] items-center gap-2">
            <button
              type="button"
              className="shrink-0 rounded-xl border border-primary px-3 py-3 text-[12px] font-semibold text-primary disabled:opacity-50"
              onClick={fetchOtp}
              disabled={sendingOtp}
            >
              {sendingOtp ? t("profile:resetPin.sendingOtp") : t("profile:resetPin.resendOtp")}
            </button>
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
              className="mono min-w-0 flex-1 rounded-2xl border-[1.5px] border-border bg-surface px-4 py-3 text-center text-[18px] tracking-[0.5em] font-bold outline-none focus:border-primary shadow-xs"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-bold text-text-1">
            {t("profile:resetPin.newMpin")}
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
            placeholder="••••"
            className="mono w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12.5px] font-bold text-text-1">
            {t("profile:resetPin.confirmMpin")}
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
            placeholder="••••"
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
          {loading ? t("profile:resetPin.submitting") : t("profile:resetPin.submitButton")}
        </button>
      </div>
    </Sheet>
  );
}
