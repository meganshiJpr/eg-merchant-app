"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseSsoParams } from "../sso";
import { verifySso } from "../api";
import { getClientMeta } from "../clientMeta";
import { checkSsoFreshness, decodeSsoClaims } from "../jwt";
import { useAuthStore } from "@/lib/auth/store";
import { ApiError } from "@/lib/net/request";
import type { Merchant } from "@/lib/auth/store";

type Phase = "verifying" | "error" | "missing" | "expired";

/**
 * Public SSO entry. Main server redirects here with the SSO JWT in the URL.
 * Flow: read token → quick client freshness gate (5 min) → POST verifyJwt with
 * user_agent/browser → store logintoken + device → land on Home.
 */
export function SsoLanding() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard strict-mode double invoke
    ran.current = true;

    const ctx = parseSsoParams(params);
    if (!ctx) {
      // Redirected here after a session expired (no SSO token to verify).
      setPhase(params.get("expired") ? "expired" : "missing");
      return;
    }

    // Fast client-side expiry pre-check (backend re-checks authoritatively).
    const fresh = checkSsoFreshness(ctx.ssoToken);
    if (!fresh.ok) {
      if (fresh.reason === "expired") {
        setPhase("expired");
        return;
      }
      // malformed/future → let the backend give the definitive verdict
    }

    const controller = new AbortController();
    verifySso(ctx.ssoToken, getClientMeta(), controller.signal)
      .then((res) => {
        // Build the merchant profile from SSO claims + device from verify.
        const claims = decodeSsoClaims(ctx.ssoToken);
        const merchant: Merchant = {
          id: claims?.uid ?? claims?.token ?? "",
          name: claims?.name ?? "",
          shopName: claims?.shopname ?? "",
          mobile: res.device ?? "",
          kycStatus: "review", // TODO(backend): real status from a profile call
        };
        setSession(res.logintoken, merchant, res.device);
        router.replace("/");
      })
      .catch((e: unknown) => {
        setPhase("error");
        setMessage(e instanceof ApiError ? e.message : "Could not sign you in. Please try again.");
      });

    return () => controller.abort();
  }, [params, router, setSession]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      {phase === "verifying" && (
        <>
          <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <div className="font-display text-[15px] font-semibold">Signing you in…</div>
          <div className="text-[12.5px] text-text-2">Verifying your secure login</div>
        </>
      )}

      {phase === "expired" && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-soft">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-orange">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4 11h-5V6h2v5h3Z" />
            </svg>
          </div>
          <div className="font-display text-[15px] font-semibold">Session expired</div>
          <div className="text-[12.5px] text-text-2">
            For your security, please open EG Merchant again from your EG dashboard to sign back in.
          </div>
        </>
      )}

      {phase === "missing" && (
        <>
          <div className="font-display text-[15px] font-semibold">Login link incomplete</div>
          <div className="text-[12.5px] text-text-2">
            This page should be opened from your EG dashboard. Please return there and try again.
          </div>
        </>
      )}

      {phase === "error" && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-accent">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
            </svg>
          </div>
          <div className="font-display text-[15px] font-semibold">Sign-in failed</div>
          <div className="text-[12.5px] text-text-2">{message}</div>
        </>
      )}
    </div>
  );
}
