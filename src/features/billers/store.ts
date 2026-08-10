"use client";

import { create } from "zustand";
import type { Biller } from "./data";

export type FetchedRow = { k: string; v: string };
export type BillContext = {
  biller: Biller;
  catTitle: string;
  catIndex: number;
  account: string;        // joined field values, for receipt
  line2: string;          // subheader-style line under the biller name
  amount: number;         // fetched or 0
  editable: boolean;      // amount editable on confirmation
  amin: number;
  amax: number;
  rowsTitle: string | null;
  rows: FetchedRow[] | null;
  custName: string | null;
};

type BillFlow = {
  ctx: BillContext | null;
  set: (ctx: BillContext) => void;
  reset: () => void;
};

export const useBill = create<BillFlow>((set) => ({
  ctx: null,
  set: (ctx) => set({ ctx }),
  reset: () => set({ ctx: null }),
}));
