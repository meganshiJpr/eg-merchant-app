"use client";

import { create } from "zustand";
import type { PayRequest } from "./types";

type PayState = {
  req: PayRequest | null;
  set: (req: PayRequest) => void;
  reset: () => void;
};

export const usePay = create<PayState>((set) => ({
  req: null,
  set: (req) => set({ req }),
  reset: () => set({ req: null }),
}));
