import type { ReceiptStatus } from "@/features/recharge/store";

/** Everything the shared payment screen needs, regardless of source module. */
export type PayRequest = {
  mode: "plan" | "bill";
  title: string;            // subheader title
  backHref: string;         // where the back button and receipt "Try Again" go
  avatar: { text: string; color: string };
  line1: string;            // e.g. "Suresh · 98212 34567"  or biller name
  line2: string;            // operator · circle · Prepaid  |  category · account
  amount: number;           // fixed amount (0 if user must enter)
  editableAmount: boolean;  // show editable input instead of static
  amin: number;
  amax: number;
  walletAllowed: boolean;
  benefits?: { v: string; l: string }[]; // plan benefits strip
  customNote?: string;      // custom-amount note (plan) or null
  fetched?: { title: string; rows: { k: string; v: string }[] } | null; // bill/customer data
  receiptRows: (amount: number, paidVia: string, txnId: string) => { k: string; v: string; mono?: boolean }[];
};

export type { ReceiptStatus };
