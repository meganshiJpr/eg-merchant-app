import { post } from "@/lib/net/request";
import type { ClientMeta } from "./clientMeta";

/**
 * SSO verification against the backend.
 *
 *   POST {BASE}/merchant/verifyJwt?token=<sso_jwt>
 *   body: { user_agent, browser }         (read server-side from raw body)
 *   auth: false                            (the SSO token IS the credential)
 *
 * Success envelope → data: { logintoken, device }
 *   logintoken → stored as the app's Bearer token for every later request
 *   device     → stored for later API access
 *
 * NOTE: signature verification of the SSO JWT happens on the backend with the
 * secret key. The frontend never holds that secret.
 */
export type VerifyResult = { logintoken: string; device: string };

export function verifySso(ssoToken: string, meta: ClientMeta, signal?: AbortSignal) {
  const path = `/merchant/verifyJwt?token=${encodeURIComponent(ssoToken)}`;
  return post<VerifyResult>(
    path,
    { user_agent: meta.userAgent, browser: meta.browser },
    { auth: false, signal },
  );
}
