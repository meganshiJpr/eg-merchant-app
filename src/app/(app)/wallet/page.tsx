"use client";

import { useState } from "react";
import { useWallet } from "@/lib/store/wallet";
import { useToast } from "@/components/ui/Toast";

const CHIPS = [100, 500, 1000, 2000, 5000];
const inr = (n: number) => n.toLocaleString("en-IN");

export default function WalletPage() {
  const wallet = useWallet();
  const toast = useToast((t) => t.show);
  const [amt, setAmt] = useState(0);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-violet p-5 text-white">
        <div className="text-[12px] opacity-80">Wallet balance</div>
        <div className="mono mt-1 text-[34px] font-semibold">Rs {inr(wallet.balance)}</div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="text-[13px] font-semibold">Add money</div>
        <div className="mono mt-3 rounded-xl border-[1.5px] border-border px-3.5 py-3 text-[22px] font-semibold">
          Rs {inr(amt)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => setAmt((a) => a + c)} className="rounded-full border border-border bg-page px-3.5 py-1.5 text-[12px] font-semibold">
              + {c}
            </button>
          ))}
          {amt > 0 && (
            <button onClick={() => setAmt(0)} className="rounded-full border border-border bg-page px-3.5 py-1.5 text-[12px] font-semibold text-text-3">
              Clear
            </button>
          )}
        </div>
        <button
          disabled={amt < 1}
          onClick={() => { wallet.credit(amt); toast(`Rs ${inr(amt)} added to wallet`); setAmt(0); }}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3.5 font-display text-[13.5px] font-semibold text-white disabled:opacity-40"
        >
          Add via UPI
        </button>
      </div>
      <p className="px-1 text-[11.5px] leading-relaxed text-text-3">
        Production: this fires a UPI intent and the gateway callback credits your wallet server-side.
        Manual bank deposits are submitted from a separate screen and appear under Reports · Manual Deposits.
      </p>
    </div>
  );
}
