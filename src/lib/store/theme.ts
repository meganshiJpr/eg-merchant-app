"use client";

import { create } from "zustand";

type ThemeState = {
  dark: boolean;
  toggle: () => void;
  apply: () => void;
};

/** Dark mode flips data-mode on <html>; our CSS tokens do the rest. */
export const useTheme = create<ThemeState>((set, get) => ({
  dark: false,
  toggle: () => {
    const dark = !get().dark;
    set({ dark });
    if (typeof document !== "undefined")
      document.documentElement.setAttribute("data-mode", dark ? "dark" : "light");
  },
  apply: () => {
    if (typeof document !== "undefined")
      document.documentElement.setAttribute("data-mode", get().dark ? "dark" : "light");
  },
}));
