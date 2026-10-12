"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/components/ui/Sheet";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";
import { fetchBankList, postBankDetails } from "@/features/profile/api";

const IFSC_BANK = {
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  SBIN: "State Bank of India",
  UTIB: "Axis Bank",
  PUNB: "Punjab National Bank",
  BARB: "Bank of Baroda",
};

export function BankAccountsTab() {
  const { t } = useTranslation(["profile", "common"]);
  const toast = useToast((t) => t.show);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [holder, setHolder] = useState("");
  const [acct, setAcct] = useState("");
  const [bankname, setBankname] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [accountType, setAccountType] = useState("Current");
  const [mpin, setMpin] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittingErr, setSubmittingErr] = useState("");

  const loadBanks = async () => {
    setLoading(true);
    try {
      const res = await fetchBankList();
      const rawList = res?.banks || res?.data?.banks || [];
      const formatted = (Array.isArray(rawList) ? rawList : []).map((item) => {
        const status = item.bank_status || "Pending";
        const isApproved = status.toLowerCase() === "approved" || status.toLowerCase() === "verified";
        const isRejected = status.toLowerCase() === "rejected";
        return {
          holder: item.ac_holder || "",
          bank: item.bank_name || "Bank Account",
          acct: item.ac_number || "",
          ifsc: item.ifsc_code || "",
          status: isApproved ? "approved" : isRejected ? "rejected" : "pending",
          tag: item.bank_status || (isApproved ? "Verified" : isRejected ? "Rejected" : "Processing"),
          reason: item.bank_reject_reason || "",
        };
      });
      setBanks(formatted);
    } catch (err) {
      console.error("Error loading banks list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const detected = IFSC_BANK[ifsc.slice(0, 4).toUpperCase()];
  const valid = holder.trim().length > 2 && acct.length >= 9 && ifsc.length === 11 && !!detected && mpin.length === 4;

  function resetForm() {
    setHolder("");
    setAcct("");
    setBankname("");
    setIfsc("");
    setAccountType("Current");
    setMpin("");
    setSubmitting(false);
    setSubmittingErr("");
  }

  async function add() {
    if (!valid || submitting) return;

    setSubmitting(true);
    setSubmittingErr("");

    try {
      const res = await postBankDetails({
        ac_holder: holder.trim(),
        ac_number: acct.trim(),
        bank_name: bankname.trim() || detected || "Bank Account",
        ifsc_code: ifsc.trim().toUpperCase(),
        account_type: accountType,
        mpin,
      });

      const isSuccess =
        res?.success === true ||
        res?.success === 1 ||
        res?.status === true ||
        res?.status === "true" ||
        res?.status === 1;

      const msg =
        res?.message ||
        res?.msg ||
        res?.data?.message ||
        (isSuccess ? t("profile:banks.successMsg", "Bank account submitted for verification") : t("profile:banks.errMsg", "Failed to add bank account."));

      if (isSuccess) {
        toast(msg);
        await loadBanks();
        setOpen(false);
        resetForm();
      } else {
        setSubmittingErr(msg);
      }
    } catch (error) {
      const errMsg =
        error?.data?.message || error?.message || t("profile:banks.errMsg", "Failed to add bank account. Please try again.");
      setSubmittingErr(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {loading ? (
        <div className="py-8 text-center text-[13px] font-medium text-text-3">{t("profile:banks.loading")}</div>
      ) : banks.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center text-[13px] text-text-3">
          {t("profile:banks.empty")}
        </div>
      ) : (
        banks.map((b, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13.5px] font-semibold">{b.bank}</div>
                <div className="mono mt-0.5 text-[11.5px] text-text-3">{b.acct}</div>
              </div>
              <Pill tone={b.status}>{b.tag}</Pill>
            </div>
            <div className="mono mt-2 text-[11px] text-text-3">
              {b.ifsc} · {b.holder}
            </div>
            {b.settlement && (
              <div className="mt-2 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-primary">
                {t("profile:menu.banksSub", "Settlement account")}
              </div>
            )}
            {b.reason && (
              <div className="mt-2 text-[11px] font-semibold text-accent">{b.reason}</div>
            )}
          </div>
        ))
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border-[1.5px] border-dashed border-primary bg-surface py-3 font-display text-[13px] font-semibold text-primary transition active:scale-98"
      >
        {t("profile:banks.addBankButton")}
      </button>

      <Sheet open={open} onClose={() => { setOpen(false); resetForm(); }}>
        <div className="mb-3 font-display text-[15px] font-semibold">{t("profile:banks.sheetTitle")}</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:banks.holderLabel")}</label>
            <input
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="As per bank records"
              className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:banks.acctLabel")}</label>
            <input
              value={acct}
              onChange={(e) => setAcct(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="Account number"
              className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:banks.bankNameLabel")}</label>
            <input
              value={bankname}
              onChange={(e) => setBankname(e.target.value)}
              placeholder="Bank name"
              className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:banks.ifscLabel")}</label>
            <input
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
              placeholder="e.g. HDFC0001234"
              className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary"
            />
            {ifsc.length >= 4 && (
              <div className={`mt-1.5 text-[11.5px] font-semibold ${detected ? "text-teal" : "text-accent"}`}>
                {detected ? `✓ ${detected}` : "Unknown IFSC prefix"}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">{t("profile:banks.accountTypeLabel")}</label>
            <div className="flex gap-8 mb-1.5">
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="radio"
                  name="accountType"
                  value="Current"
                  checked={accountType === "Current"}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="h-4 w-4 accent-primary"
                />
                {t("profile:banks.current")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input
                  type="radio"
                  name="accountType"
                  value="Savings"
                  checked={accountType === "Savings"}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="h-4 w-4 accent-primary"
                />
                {t("profile:banks.savings")}
              </label>
            </div>
          </div>
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

        {submittingErr && (
          <div className="mt-2.5 text-[11.5px] font-semibold text-rose-600">
            {submittingErr}
          </div>
        )}

        <button
          type="button"
          disabled={!valid || submitting}
          onClick={add}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white transition active:scale-98 disabled:opacity-40"
        >
          {submitting ? t("profile:banks.submitting") : t("profile:banks.submitButton")}
        </button>
      </Sheet>
    </div>
  );
}
