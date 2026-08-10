"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import { PayScreen } from "@/features/payment/components/PayScreen";
import { usePay } from "@/features/payment/store";
import { useRecharge } from "@/features/recharge/store";
import { fmtNum, inr, perDay } from "@/features/recharge/data";

export default function RechargePayPage() {
  const router = useRouter();
  const flow = useRecharge();
  const setReq = usePay((s) => s.set);

  useEffect(() => {
    const op = flow.operator;
    const amount = flow.plan?.amt ?? flow.customAmt ?? 0;
    if (!op || !amount) {
      router.replace("/recharge");
      return;
    }
    const plan = flow.plan;
    setReq({
      mode: "plan",
      title: "Payment Details",
      backHref: "/recharge",
      avatar: { text: op.abbr, color: op.color },
      line1: `${flow.name ? flow.name + " · " : ""}${fmtNum(flow.num)}`,
      line2: `${op.name} · ${flow.circle} · Prepaid`,
      amount,
      editableAmount: false,
      amin: 0,
      amax: Infinity,
      walletAllowed: op.walletAllowed,
      benefits: plan ? [
        { v: plan.calls, l: "Calls" }, { v: plan.sms, l: "SMS" },
        { v: plan.data, l: "Data" }, { v: plan.val, l: "Validity" },
      ] : undefined,
      customNote: !plan ? "This is a custom amount. The operator will apply the matching plan or talktime for this value." : undefined,
      fetched: null,
      receiptRows: (amt, via, txnId) => [
        { k: "Mobile number", v: fmtNum(flow.num), mono: true },
        { k: "Operator", v: `${op.name} · ${flow.circle}` },
        { k: "Plan", v: plan ? `Rs ${inr(plan.amt)} · ${plan.val}${perDay(plan) ? " · " + perDay(plan) : ""}` : "Custom amount · as per operator" },
        { k: "Paid via", v: via },
        { k: "Amount", v: `Rs ${inr(amt)}`, mono: true },
        { k: "Txn ID", v: txnId, mono: true },
      ],
    });
  }, [flow, setReq, router]);

  return (
    <>
      <SubHeader title="Payment Details" backHref="/recharge" />
      <PayScreen />
    </>
  );
}
