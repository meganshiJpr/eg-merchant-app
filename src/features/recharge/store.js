"use client";

import { create } from "zustand";

const initial = {
  num: "",
  name: null,
  operator: null,
  circle: "Rajasthan",
  plan: null,
  customAmt: null,
  receipt: null,
};

export const useRecharge = create((set) => ({
  ...initial,
  set: (p) => set(p),
  reset: () => set(initial),
}));
