"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseSsoParams } from "../sso";
import { verifySso } from "../api";
import { getClientMeta } from "../clientMeta";
import { checkSsoFreshness, decodeSsoClaims } from "../jwt";
import { useAuthStore } from "@/lib/auth/store";
import { ApiError } from "@/lib/net/request";
import Cookies from "js-cookie";

export function SsoLanding() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [phase, setPhase] = useState("verifying");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const ctx = parseSsoParams(params);
    if (!ctx) {
      setPhase(params.get("expired") ? "expired" : "missing");
      return;
    }

    const fresh = checkSsoFreshness(ctx.ssoToken);
    if (!fresh.ok) {
      if (fresh.reason === "expired") {
        setPhase("expired");
        return;
      }
    }

    const controller = new AbortController();
    verifySso(ctx.ssoToken, getClientMeta(), controller.signal)
      .then((res) => {
        const claims = decodeSsoClaims(ctx.ssoToken);
        const merchant = {
          id: claims?.uid ?? claims?.token ?? "",
          name: claims?.name ?? "",
          shopName: claims?.shopname ?? "",
          mobile: res.device ?? "",
          kycStatus: "review",
        };
        Cookies.set("authToken", res.logintoken, { expires: 1 });
        Cookies.set("authMobile", res.device ?? "", { expires: 1 });
        // console.log("Stored authToken:", res.logintoken);
        // console.log("Stored authMobile:", res.device ?? "");
        setSession(res.logintoken, merchant, res.device);
        router.replace("/");
      })
      .catch((e) => {
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
