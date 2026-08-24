"use client";

import { create } from "zustand";

// Deliberately not persisted: closing the app/tab is the only way to dismiss
// the session-expired screen and begin a fresh SSO session.
export const useSessionExpiryStore = create((set) => ({
  expired: false,
  showExpired: () => set({ expired: true }),
}));
