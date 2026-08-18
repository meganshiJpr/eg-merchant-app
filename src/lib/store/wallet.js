"use client";

import { create } from "zustand";

export const useWallet = create((set) => ({
  balance: 850,
  credit: (n) => set((s) => ({ balance: s.balance + n })),
  debit: (n) => set((s) => ({ balance: s.balance - n })),
}));
