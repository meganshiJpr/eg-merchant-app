"use client";

import { create } from "zustand";

/**
 * Demo wallet — Rs 850 on purpose so both payment branches are testable
 * (Rs 299 plan = sufficient, Rs 3,199 = shortfall).
 * Production: balance comes from GET /wallet and mutations happen server-side;
 * this store then only mirrors the server value.
 */
type WalletState = {
  balance: number;
  credit: (n: number) => void;
  debit: (n: number) => void;
};

export const useWallet = create<WalletState>((set) => ({
  balance: 850,
  credit: (n) => set((s) => ({ balance: s.balance + n })),
  debit: (n) => set((s) => ({ balance: s.balance - n })),
}));
