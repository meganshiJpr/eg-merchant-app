"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePay } from "../store";
import { useWallet } from "@/lib/store/wallet";
import { useToast } from "@/components/ui/Toast";
import { useRecharge, type ReceiptStatus } from "@/features/recharge/store";
import { Sheet } from "@/components/ui/Sheet";
import { MpinSheet } from "@/features/recharge/components/MpinSheet";

const inr = (n: number) => n.toLocaleString("en-IN");
const UPI_APPS = [
  { n: "PhonePe", c: "#5F259F", a: "Pe" },
  { n: "Google Pay", c: "#1A73E8", a: "G" },
  { n: "Paytm", c: "#00BAF2", a: "Pt" },
  { n: "Other UPI app", c: "#5B5F73", a: "UPI" },
];

function statusFromPin(pin: string): ReceiptStatus {
  const d = parseInt(pin[3], 10);
  if (d >= 1 && d <= 5) return "success";
  if (d <= 7) return "processing";
  if (d === 8) return "failed";
  return "refunded";
}

export function PayScreen() {
  const router = useRouter();
  const req = usePay((s) => s.req);
  const wallet = useWallet();
  const toast = useToast((t) => t.show);
  const setReceipt = useRecharge((s) => s.set);

  const [useWalletBal, setUseWalletBal] = useState(true);
  const [amountStr, setAmountStr] = useState("");
  const [upiOpen, setUpiOpen] = useState(false);
  const [upiStatus, setUpiStatus] = useState("");
  const [mpinOpen, setMpinOpen] = useState(false);
  const [upiTopped, setUpiTopped] = useState(false);

  useEffect(() => {
    if (!req) {
      router.replace("/");
      return;
    }
    setUseWalletBal(req.walletAllowed);
    setAmountStr(req.amount ? `Rs ${inr(req.amount)}` : "");
  }, [req, router]);

  const amount = useMemo(() => {
    if (!req) return 0;
    if (!req.editableAmount) return req.amount;
    const v = amountStr.replace(/[^0-9]/g, "");
    return v ? parseInt(v, 10) : 0;
  }, [req, amountStr]);

  if (!req) return null;

  const amtOk = req.editableAmount ? amount >= req.amin && amount <= req.amax : amount > 0;
  const walletUsable = useWalletBal && req.walletAllowed ? wallet.balance : 0;
  const walletPortion = amtOk ? Math.min(walletUsable, amount) : 0;
  const short = amtOk ? amount - walletPortion : 0;
  const upiOnly = walletPortion === 0;
  const paidVia = walletPortion === 0 ? "UPI" : upiTopped ? "Wallet + UPI" : "Wallet";

  function onAmt(v: string) {
    const digits = v.replace(/[^0-9]/g, "");
    setAmountStr(digits ? `Rs ${parseInt(digits, 10).toLocaleString("en-IN")}` : "");
  }

  function finish(status: ReceiptStatus, via: string, walletDebit: number) {
    const deduct = status === "success" || status === "processing";
    if (deduct && walletDebit > 0) wallet.debit(walletDebit);
    const txnId = `${req!.mode === "bill" ? "BP" : "RC"}${Date.now().toString().slice(-9)}`;
    setReceipt({
      receipt: {
        status,
        amount,
        paidVia: via as "Wallet" | "UPI" | "Wallet + UPI",
        mode: req!.mode,
        retryHref: status === "failed" || status === "refunded" ? req!.backHref : null,
        rows: req!.receiptRows(amount, via, txnId),
      },
    });
    router.push("/recharge/receipt");
  }

  function pickUpi(name: string) {
    setUpiStatus(`Opening ${name}...`);
    setTimeout(() => {
      setUpiOpen(false);
      setUpiStatus("");
      if (upiOnly) finish("success", "UPI", 0);
      else {
        wallet.credit(short);
        setUpiTopped(true);
        toast(`Rs ${inr(short)} added to wallet`);
        setMpinOpen(true);
      }
    }, 1200);
  }

  const btnLabel = !amtOk
    ? `Enter Rs ${inr(req.amin)} – ${inr(req.amax)}`
    : short > 0
      ? upiOnly
        ? `Pay Rs ${inr(short)} via UPI`
        : `Add Rs ${inr(short)} & Proceed`
      : `${req.mode === "bill" ? "Pay" : "Recharge"} Rs ${inr(amount)}`;

  return (
    <div className="flex flex-col gap-3 p-4 pb-24">
      {/* Selected entity */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3">
        <span
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-[12px] font-bold text-white"
          style={{ background: req.avatar.color }}
        >
          {req.avatar.text}
        </span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold">{req.line1}</div>
          <div className="text-[11.5px] text-text-2">{req.line2}</div>
        </div>
      </div>

      {/* Amount (fixed or editable) */}
      <div className="py-3 text-center">
        {req.editableAmount ? (
          <input
            value={amountStr}
            onChange={(e) => onAmt(e.target.value)}
            inputMode="numeric"
            placeholder="Rs 0"
            className="mono w-[220px] border-b-2 border-primary bg-transparent pb-1.5 text-center text-[36px] font-semibold tracking-tight outline-none placeholder:opacity-40"
          />
        ) : (
          <div className="mono text-[40px] font-semibold tracking-tight">Rs {inr(amount)}</div>
        )}
        {req.editableAmount && (
          <div className="mono mt-1 text-[12px] font-semibold text-text-3">
            Min Rs {inr(req.amin)} · Max Rs {inr(req.amax)}
          </div>
        )}
        {req.customNote && (
          <div className="mt-2 rounded-xl bg-primary-soft px-4 py-2.5 text-left text-[11.5px] leading-relaxed text-primary">
            {req.customNote}
          </div>
        )}
      </div>

      {/* Benefits (plan mode) */}
      {req.benefits && (
        <div className="rounded-2xl border border-border bg-surface p-3.5">
          <div className="grid grid-cols-4 divide-x divide-border rounded-xl bg-page py-2">
            {req.benefits.map((b) => (
              <div key={b.l} className="px-1 text-center">
                <div className="text-[11px] font-semibold leading-tight">{b.v}</div>
                <div className="mt-0.5 text-[9.5px] text-text-3">{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fetched bill/customer data (bill mode) */}
      {req.fetched && (
        <div className="rounded-2xl border border-border bg-surface px-4 py-1">
          <div className="flex items-center gap-2 py-2.5 text-[12px] font-bold text-teal">
            <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]">
              <path d="M6 12.5 10.2 16.7 18 8.5" stroke="var(--teal)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {req.fetched.title}
          </div>
          {req.fetched.rows.map((r) => (
            <div key={r.k} className="flex justify-between border-t border-border py-2.5 text-[12.5px]">
              <span className="text-text-3">{r.k}</span>
              <span className="font-semibold">{r.v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Wallet toggle */}
      <div className="rounded-2xl border border-border bg-surface p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-primary-soft">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-primary">
              <path d="M20 6H5.5A1.5 1.5 0 0 1 5.5 3H19V1H5.5A3.5 3.5 0 0 0 2 4.5V19a3 3 0 0 0 3 3h15a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm-3.5 9.5A1.75 1.75 0 1 1 18.25 13.75 1.75 1.75 0 0 1 16.5 15.5Z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold text-text-2">Use wallet balance</div>
            <div className={`mono mt-0.5 text-[13px] font-semibold ${useWalletBal && req.walletAllowed && wallet.balance < amount ? "text-accent" : ""}`}>
              Rs {inr(wallet.balance)} available
            </div>
          </div>
          <button
            aria-label="Toggle wallet"
            onClick={() => {
              if (!req.walletAllowed) {
                toast(`Wallet not allowed for ${req.line1}`);
                return;
              }
              setUseWalletBal((v) => !v);
            }}
            className={`relative h-6 w-11 flex-none rounded-full transition ${useWalletBal && req.walletAllowed ? "bg-primary" : "bg-border"} ${req.walletAllowed ? "" : "opacity-35"}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${useWalletBal && req.walletAllowed ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        {!req.walletAllowed && (
          <div className="mt-2.5 flex gap-2 text-[11px] font-semibold leading-relaxed text-accent">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-3.5 w-3.5 flex-none fill-accent">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2Zm0-8h-2V7h2Z" />
            </svg>
            Wallet payment is not allowed for this operator. Only UPI payment is available.
          </div>
        )}
      </div>

      {/* Calculation */}
      {amtOk && (
        <div className="rounded-2xl border border-border bg-surface p-3.5 text-[12.5px]">
          <Row label={req.mode === "bill" ? "Bill amount" : "Recharge amount"} value={`Rs ${inr(amount)}`} />
          <Row label="Paid from wallet" value={`Rs ${inr(walletPortion)}`} />
          {short > 0 && <Row label="Amount to add" value={`Rs ${inr(short)}`} accent />}
          <div className="mt-2 flex justify-between border-t border-dashed border-border pt-2.5 text-[13.5px] font-bold">
            <span>{short > 0 ? (upiOnly ? "Payable via UPI" : "Payable now (add via UPI)") : "Total from wallet"}</span>
            <span className="mono text-[15px]">Rs {inr(short > 0 ? short : amount)}</span>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-app border-t border-border bg-surface p-3">
        <button
          disabled={!amtOk}
          onClick={() => (short > 0 ? setUpiOpen(true) : setMpinOpen(true))}
          className="w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white active:scale-[0.985] disabled:opacity-40 disabled:active:scale-100"
        >
          {btnLabel}
        </button>
      </div>

      <Sheet open={upiOpen} onClose={() => setUpiOpen(false)}>
        <div className="mb-3 font-display text-[15px] font-semibold">
          Add <span className="mono">Rs {inr(short)}</span> via UPI
        </div>
        {UPI_APPS.map((a) => (
          <button
            key={a.n}
            onClick={() => pickUpi(a.n)}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-border bg-page px-3 py-2.5 text-left"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg font-display font-bold text-white" style={{ background: a.c, fontSize: a.a.length > 2 ? 8 : 11 }}>
              {a.a}
            </span>
            <span className="text-[13px] font-semibold">{a.n}</span>
          </button>
        ))}
        <div className="min-h-[18px] pt-1 text-center text-[12px] font-semibold text-text-2">{upiStatus}</div>
      </Sheet>

      <MpinSheet open={mpinOpen} onClose={() => setMpinOpen(false)} onComplete={(pin) => { setMpinOpen(false); finish(statusFromPin(pin), paidVia, walletPortion); }} />
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between py-1 text-text-2">
      <span>{label}</span>
      <span className={`mono font-semibold ${accent ? "text-accent" : "text-text-1"}`}>{value}</span>
    </div>
  );
}
