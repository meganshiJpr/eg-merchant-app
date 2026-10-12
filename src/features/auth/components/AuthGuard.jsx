"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { useSessionExpiryStore } from "@/lib/auth/sessionExpiryStore";

export function AuthGuard({ children }) {
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const sessionExpired = useSessionExpiryStore((s) => s.expired);
  const router = useRouter();
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);

  // /profile-details and /sso route paths are unauthenticated onboarding views
  const isPublicOnboarding = pathname === "/profile-details" || pathname?.startsWith("/sso");

  useEffect(() => {
    if (hydrated && !token) setShowLogin(true);
    else if (token) setShowLogin(false);
  }, [hydrated, token]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  // Keep the current screen visible behind the global, blocking expiry modal.
  // The overlay makes it inert, so no expired-screen action can be used.
  if (sessionExpired) return <>{children}</>;

  if ((!token || showLogin) && !isPublicOnboarding) {
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
