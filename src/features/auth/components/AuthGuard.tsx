"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Client-side route guard for the (app) and (flow) groups.
 *
 * - Waits for the persisted auth store to rehydrate (avoids bouncing a valid
 *   session on refresh).
 * - If there is no login token, shows a "log in from your dashboard" screen
 *   instead of the protected content (SSO is the only way in).
 *
 * The public /sso route is NOT wrapped by this guard, so login always works.
 * Server-side revocation is still enforced everywhere via 401 → clear().
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (hydrated && !token) setShowLogin(true);
    else if (token) setShowLogin(false);
  }, [hydrated, token]);

  // While the store is rehydrating we don't know yet — show a neutral splash
  // rather than flashing either the app or the login screen.
  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  if (!token || showLogin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-primary">
            <path d="M12 1a5 5 0 0 0-5 5v3H5v13h14V9h-2V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0Zm-3 5a1.8 1.8 0 0 1 1 3.3V19h-2v-1.7A1.8 1.8 0 0 1 12 14Z" />
          </svg>
        </div>
        <div className="font-display text-[16px] font-semibold">Please log in</div>
        <div className="max-w-[280px] text-[12.5px] leading-relaxed text-text-2">
          Open EG Merchant from your EG dashboard to sign in securely. This screen
          is protected and needs an active session.
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
