"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { UpdateMpin } from "@/features/profile/api";

export function ChangePinSheet({ open, onClose }) {
  const { t } = useTranslation(["profile", "common"]);
  const toast = useToast((t) => t.show);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setCur("");
    setNext("");
    setConf("");
    setErr("");
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  async function submit() {
    if (cur.length !== 4 || next.length !== 4 || conf.length !== 4) {
      return setErr(t("profile:changePin.errLength"));
    }
    if (next !== conf) {
      return setErr(t("profile:changePin.errMismatch"));
    }
    if (next === cur) {
      return setErr(t("profile:changePin.errSame"));
    }

    setErr("");
    setLoading(true);

    try {
      const res = await UpdateMpin({
        old_mpin: cur,
        new_mpin: next,
      });

      const isSuccess = res?.success === true || res?.success === 1 || res?.status === true || res?.status === "true" || res?.status === 1;

      const msg =
        res?.message ||
        res?.msg ||
        res?.data?.message ||
        (isSuccess ? t("profile:changePin.successMsg", "MPIN updated successfully!") : t("profile:changePin.errMsg", "Failed to update MPIN. Please try again."));

      if (isSuccess) {
        toast(msg);
        resetForm();
        onClose();
      } else {
        setErr(msg);
      }
    } catch (error) {
      const errMsg =
        error?.data?.message || error?.message || t("profile:changePin.errMsg", "Failed to update MPIN. Please try again.");
      setErr(errMsg);
    } finally {
      setLoading(false);
    }
  }

  const field = (label, val, set) => (
    <div>
      <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{label}</label>
      <input
        value={val}
        onChange={(e) => {
          setErr("");
          set(e.target.value.replace(/\D/g, "").slice(0, 4));
        }}
        inputMode="numeric"
        type="password"
        maxLength={4}
        placeholder="••••"
        className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[16px] tracking-[0.5em] outline-none focus:border-primary"
      />
    </div>
  );

  return (
    <Sheet open={open} onClose={handleClose}>
      <div className="mb-3 font-display text-[15px] font-semibold">{t("profile:changePin.title")}</div>
      <div className="flex flex-col gap-3">
        {field(t("profile:changePin.currentMpin"), cur, setCur)}
        {field(t("profile:changePin.newMpin"), next, setNext)}
        {field(t("profile:changePin.confirmMpin"), conf, setConf)}
      </div>
      {err && <div className="mt-2.5 text-[11.5px] font-semibold text-accent">{err}</div>}
      <button
        type="button"
        disabled={loading || cur.length !== 4 || next.length !== 4 || conf.length !== 4}
        onClick={submit}
        className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white transition active:scale-98 disabled:opacity-50"
      >
        {loading ? t("profile:changePin.submitting") : t("profile:changePin.submitButton")}
      </button>
    </Sheet>
  );
}
