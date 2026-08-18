"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import { PayScreen } from "@/features/payment/components/PayScreen";
import { usePay } from "@/features/payment/store";
import { useBill } from "@/features/billers/store";
import { inr } from "@/utils/format";

export default function BillPayPage() {
  const router = useRouter();
  const ctx = useBill((s) => s.ctx);
  const setReq = usePay((s) => s.set);

  useEffect(() => {
    if (!ctx) {
      router.replace("/");
      return;
    }
    setReq({
      mode: "bill",
      title: "Payment Details",
      backHref: "/billers",
      avatar: { text: ctx.biller.a, color: ctx.biller.c },
      line1: ctx.biller.n,
      line2: ctx.line2,
      amount: ctx.amount,
      editableAmount: ctx.editable,
      amin: ctx.amin,
      amax: ctx.amax,
      walletAllowed: ctx.biller.walletAllowed !== false,
      fetched: ctx.rows ? { title: ctx.rowsTitle, rows: ctx.rows } : null,
      receiptRows: (amount, via, txnId) => [
        { k: "Operator", v: ctx.biller.n },
        { k: "Category", v: ctx.catTitle },
        { k: "Account", v: ctx.account, mono: true },
        ...(ctx.custName ? [{ k: "Customer", v: ctx.custName }] : []),
        { k: "Paid via", v: via },
        { k: "Amount", v: `Rs ${inr(amount)}`, mono: true },
        { k: "Order ID", v: txnId, mono: true },
      ],
    });
  }, [ctx, setReq, router]);

  if (!ctx) return null;
  return (
    <>
      <SubHeader title="Payment Details" backHref={`/billers/form?cat=${ctx.catIndex}`} />
      <PayScreen />
    </>
  );
}
