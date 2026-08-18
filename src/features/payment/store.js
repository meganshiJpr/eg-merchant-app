"use client";

import { create } from "zustand";

export const usePay = create((set) => ({
  req: null,
  set: (req) => set({ req }),
  reset: () => set({ req: null }),
}));
