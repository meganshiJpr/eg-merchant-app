"use client";

import { create } from "zustand";
import type { Operator, Plan } from "./data";

export type ReceiptStatus = "success" | "processing" | "failed" | "refunded";

export type Receipt = {
  status: ReceiptStatus;
  amount: number;
  paidVia: "Wallet" | "UPI" | "Wallet + UPI";
  rows: { k: string; v: string; mono?: boolean }[];
  retryHref: string | null;
  mode: "plan" | "bill";
};

type RechargeFlow = {
  num: string;
  name: string | null;
  operator: Operator | null;
  circle: string;
  plan: Plan | null;
  customAmt: number | null;
  receipt: Receipt | null;
  set: (p: Partial<Omit<RechargeFlow, "set" | "reset">>) => void;
  reset: () => void;
};

const initial = {
  num: "",
  name: null,
  operator: null,
  circle: "Rajasthan",
  plan: null,
  customAmt: null,
  receipt: null,
};

export const useRecharge = create<RechargeFlow>((set) => ({
  ...initial,
  set: (p) => set(p),
  reset: () => set(initial),
}));
