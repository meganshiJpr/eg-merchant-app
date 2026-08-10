"use client";

import { useState } from "react";
import { SubHeader } from "@/components/ui/SubHeader";
import { Sheet } from "@/components/ui/Sheet";
import { Pill } from "@/components/ui/Pill";
import { useToast } from "@/components/ui/Toast";

type Bank = { holder: string; bank: string; acct: string; ifsc: string; status: "approved" | "pending" | "rejected"; tag: string; reason?: string; settlement?: boolean };

const IFSC_BANK: Record<string, string> = {
  HDFC: "HDFC Bank", ICIC: "ICICI Bank", SBIN: "State Bank of India",
  UTIB: "Axis Bank", PUNB: "Punjab National Bank", BARB: "Bank of Baroda",
};

const INITIAL: Bank[] = [
  { holder: "Ramesh Kumar", bank: "HDFC Bank", acct: "50100XXXXXX4521", ifsc: "HDFC0001234", status: "approved", tag: "Verified", settlement: true },
  { holder: "Ramesh Kumar", bank: "ICICI Bank", acct: "62450XXXXXX8890", ifsc: "ICIC0004521", status: "pending", tag: "Processing" },
  { holder: "R Kumar", bank: "Axis Bank", acct: "91800XXXXXX2214", ifsc: "UTIB0000567", status: "rejected", tag: "Rejected", reason: "Name mismatch with KYC records" },
];

export default function BanksPage() {
  const toast = useToast((t) => t.show);
  const [banks, setBanks] = useState<Bank[]>(INITIAL);
  const [open, setOpen] = useState(false);
  const [holder, setHolder] = useState("");
  const [acct, setAcct] = useState("");
  const [ifsc, setIfsc] = useState("");
  const detected = IFSC_BANK[ifsc.slice(0, 4).toUpperCase()];
  const valid = holder.trim().length > 2 && acct.length >= 9 && ifsc.length === 11 && !!detected;

  function add() {
    setBanks((b) => [...b, { holder, bank: detected!, acct: acct.replace(/.(?=.{4})/g, "X"), ifsc: ifsc.toUpperCase(), status: "pending", tag: "Processing" }]);
    setOpen(false); setHolder(""); setAcct(""); setIfsc("");
    toast("Bank account submitted for verification");
  }

  return (
    <>
      <SubHeader title="Bank Accounts" backHref="/profile" />
      <div className="flex flex-col gap-3 p-4">
        {banks.map((b, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13.5px] font-semibold">{b.bank}</div>
                <div className="mono mt-0.5 text-[11.5px] text-text-3">{b.acct}</div>
              </div>
              <Pill tone={b.status}>{b.tag}</Pill>
            </div>
            <div className="mono mt-2 text-[11px] text-text-3">{b.ifsc} · {b.holder}</div>
            {b.settlement && <div className="mt-2 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-primary">Settlement account</div>}
            {b.reason && <div className="mt-2 text-[11px] font-semibold text-accent">{b.reason}</div>}
          </div>
        ))}
        <button onClick={() => setOpen(true)} className="rounded-xl border-[1.5px] border-dashed border-primary bg-surface py-3 font-display text-[13px] font-semibold text-primary">
          + Add bank account
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="mb-3 font-display text-[15px] font-semibold">Add bank account</div>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">Account holder name</label>
            <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="As per bank records" className="w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">Account number</label>
            <input value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Account number" className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-text-2">IFSC code</label>
            <input value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} placeholder="e.g. HDFC0001234" className="mono w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[14px] outline-none focus:border-primary" />
            {ifsc.length >= 4 && (
              <div className={`mt-1.5 text-[11.5px] font-semibold ${detected ? "text-teal" : "text-accent"}`}>
                {detected ? `✓ ${detected}` : "Unknown IFSC prefix"}
              </div>
            )}
          </div>
        </div>
        <button disabled={!valid} onClick={add} className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-40">
          Add account
        </button>
      </Sheet>
    </>
  );
}
