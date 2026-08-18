"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Long-lived login token + device, persisted so the WebView wrappers keep the
 * session across restarts. Revocation is server-side (401 → clear()).
 *
 * `hydrated` matters for the route guard: persisted state loads from storage
 * AFTER the first client render, so the guard must wait for hydration before
 * deciding a user is logged out — otherwise a refresh would bounce a valid
 * session to the login screen for a frame.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      device: null,
      merchant: null,
      hydrated: false,
      setSession: (token, merchant, device = null) => set({ token, merchant, device }),
      clear: () => set({ token: null, device: null, merchant: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "eg-auth",
      // don't persist the transient hydration flag
      partialize: (s) => ({ token: s.token, device: s.device, merchant: s.merchant }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
