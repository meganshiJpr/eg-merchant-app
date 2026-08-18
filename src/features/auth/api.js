import { post } from "@/lib/net/request";

export function verifySso(ssoToken, meta, signal) {
  const path = `/merchant/verifyJwt?token=${encodeURIComponent(ssoToken)}`;
  
  return post(
    path,
    { user_agent: meta.userAgent, browser: meta.browser },
    { auth: false, signal },
  );
}
