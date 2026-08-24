"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubHeader } from "@/components/ui/SubHeader";
import { PayScreen } from "@/features/payment/components/PayScreen";
import { usePay } from "@/features/payment/store";
import { useBill } from "@/features/billers/store";
import { useRecharge } from "@/features/recharge/store";
import { inr } from "@/utils/format";

export default function BillPayPage() {
  const router = useRouter();
  const ctx = useBill((s) => s.ctx);
  const flow = useRecharge();
  const setReq = usePay((s) => s.set);

  const activeCtx = ctx || (flow.num ? {
    biller: { n: flow.operatorName, logo: flow.operatorLogo, a: flow.operatorName ? flow.operatorName.slice(0,2) : "BL", c: "#3B0764", walletAllowed: true },
    catTitle: flow.serviceType,
    categoryType: flow.serviceType,
    account: flow.num,
    session_id: flow.session_id,
    billdata: flow.billdata,
    slabs: flow.slabs,
    billAmount: flow.billAmount || flow.amount,
    amount: flow.amount || flow.billAmount,
    custName: flow.custName,
    title: "Customer Information",
  } : null);

  useEffect(() => {
    if (!activeCtx) {
      router.replace("/");
      return;
    }

    // Filter non-empty billdata rows
    const rawBilldata = activeCtx.billdata || {};
    const validRows = [];
    Object.entries(rawBilldata).forEach(([k, v]) => {
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        validRows.push({ k, v: String(v).trim() });
      }
    });

    const custName = rawBilldata["Customer Name"] || activeCtx.custName || null;
    const subtitleText = custName ? custName : `${activeCtx.catTitle || activeCtx.categoryType || "Biller"} · ${activeCtx.account}`;

    setReq({
      mode: "bill",
      title: "Payment Details",
      backHref: activeCtx.categoryType ? `/billers?type=${activeCtx.categoryType}` : `/billers?cat=${activeCtx.catIndex || 0}`,
      avatar: { text: activeCtx.biller?.a || "BL", color: activeCtx.biller?.c || "#3B0764", logo: activeCtx.biller?.logo },
      line1: activeCtx.biller?.n || "Biller",
      account: activeCtx.account,
      custName: custName,
      session_id: activeCtx.session_id,
      rawBilldata: rawBilldata,
      slabs: activeCtx.slabs || [],
      amount: activeCtx.amount || activeCtx.billAmount || 0,
      billAmount: activeCtx.billAmount || 0,
      details: activeCtx.details || flow.details || null,
      editableAmount: true,
      amin: activeCtx.amin || 1,
      amax: activeCtx.amax || 50000,
      walletAllowed: activeCtx.biller?.walletAllowed !== false,
      fetched: validRows.length > 0 ? { title: activeCtx.title || "Customer Information", rows: validRows } : null,
      receiptRows: (amount, via, txnId) => [
        { k: "Operator", v: activeCtx.biller?.n || "Biller" },
        { k: "Category", v: activeCtx.catTitle || activeCtx.categoryType },
        { k: "Account", v: activeCtx.account, mono: true },
        ...(custName ? [{ k: "Customer", v: custName }] : []),
        { k: "Paid via", v: via },
        { k: "Amount", v: `Rs ${inr(amount)}`, mono: true },
        { k: "Order ID", v: txnId, mono: true },
      ],
    });
  }, [activeCtx, setReq, router]);

  if (!activeCtx) return null;
  return (
    <>
      <SubHeader title="Payment Details" backHref={`/billers/form?type=${activeCtx.categoryType || "DTH"}${activeCtx.operator || activeCtx.biller?.id ? `&operator=${activeCtx.operator || activeCtx.biller?.id}` : ""}`} />
      <PayScreen />
    </>
  );
}
