"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initial = {
  mode: "recharge",
  serviceType: "Prepaid",
  num: "",
  name: null,
  operator: null,
  operatorName: null,
  operatorLogo: null,
  circle: "14",
  circleName: "Rajasthan",
  session_id: null,
  operatorPlanSessionId: null,
  operatorPlanData: null,
  plan: null,
  amount: 0,
  billAmount: 0,
  slabs: [],
  billdata: null,
  custName: null,
  paymentDetails: null,
  customAmt: null,
  receipt: null,
};

export const useRecharge = create(
  persist(
    (set) => ({
      ...initial,
      set: (p) => set(p),
      reset: () => set(initial),
    }),
    {
      name: "transaction_flow_session",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? sessionStorage : undefined)),
    }
  )
);
