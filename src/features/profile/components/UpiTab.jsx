"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/components/ui/Sheet";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";

const INITIAL_UPIS = [
  { vpa: "9821249876@payby", acct: "50100XXXXXX4521", status: "approved", tag: "Verified", primary: true },
];

export function UpiTab() {
  const { t } = useTranslation(["profile", "common"]);
  const toast = useToast((t) => t.show);
  const [upis, setUpis] = useState(INITIAL_UPIS);
  const [open, setOpen] = useState(false);

  const [holder, setHolder] = useState("");
  const [vpa, setVpa] = useState("");
  const [mpin, setMpin] = useState("");

  const valid = holder.trim().length > 2 && vpa.trim().includes("@") && mpin.length === 4;

  function resetForm() {
    setHolder("");
    setVpa("");
    setMpin("");
  }

  function add() {
    setUpis((u) => [
      ...u,
      {
        vpa: vpa.trim(),
        acct: holder.trim(),
        status: "pending",
        tag: "Processing",
        primary: false,
      },
    ]);
    setOpen(false);
    resetForm();
    toast(t("profile:upi.successMsg", "UPI ID submitted successfully"));
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {upis.map((u, i) => (
        <div key={i} className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="mono text-[14px] font-bold text-text-1">{u.vpa}</div>
              <div className="mono mt-0.5 text-[11.5px] text-text-3">Holder: {u.acct}</div>
            </div>
            <Pill tone={u.status}>{u.tag}</Pill>
          </div>
          {u.primary && (
            <div className="mt-2 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-primary">
              Primary UPI ID
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border-[1.5px] border-dashed border-primary bg-surface py-3 font-display text-[13px] font-semibold text-primary transition active:scale-98"
      >
        {t("profile:upi.addUpiButton")}
      </button>

      <Sheet open={open} onClose={() => { setOpen(false); resetForm(); }}>
        <div className="mb-3 font-display text-[15px] font-semibold">{t("profile:upi.sheetTitle")}</div>
        <div className="flex flex-col gap-3">
          {/* 1. Account Holder Name */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:upi.holderLabel")}</label>
            <input
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Enter Account Holder Name"
              className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
          </div>

          {/* 2. Enter VPA */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:upi.vpaLabel")}</label>
            <input
              value={vpa}
              onChange={(e) => setVpa(e.target.value)}
              placeholder="Enter VPA (e.g. mobile@payby)"
              className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
          </div>

          {/* 3. M PIN */}
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">M PIN</label>
            <input
              value={mpin}
              onChange={(e) => setMpin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              type="password"
              maxLength={4}
              placeholder="••••"
              className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!valid}
          onClick={add}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white transition active:scale-98 disabled:opacity-40"
        >
          {t("profile:upi.submitButton")}
        </button>
      </Sheet>
    </div>
  );
}
