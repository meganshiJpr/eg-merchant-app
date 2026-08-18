"use client";

import { create } from "zustand";

export const useBill = create((set) => ({
  ctx: null,
  set: (ctx) => set({ ctx }),
  reset: () => set({ ctx: null }),
}));
