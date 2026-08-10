/**
 * Client-side SSO-token helpers (UX + fast pre-check only).
 *
 * SECURITY BOUNDARY: the browser never holds the JWT secret. The backend
 * (/merchant/verifyJwt) does the authoritative HMAC-SHA256 signature check and
 * enforces expiry. Here we only decode claims for display and reject obviously
 * stale links before spending a network round-trip.
 */

export type SsoClaims = {
  name: string;
  shopname: string;
  iat: number;          // issued-at (seconds)
  exp?: number;         // expiry (seconds) — present in newer tokens
  uid?: string;
  token?: string;       // some tokens carry a uuid here instead of uid
};

/** Fallback window if a token has no exp: 5 minutes from iat. */
export const SSO_TTL_SECONDS = 5 * 60;

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Decode the payload WITHOUT verifying the signature. UX only. */
export function decodeSsoClaims(token: string): SsoClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const j = JSON.parse(base64UrlDecode(parts[1]));
    if (typeof j?.name === "string" && typeof j?.shopname === "string" && typeof j?.iat === "number") {
      return j as SsoClaims;
    }
    return null;
  } catch {
    return null;
  }
}

export type Freshness =
  | { ok: true; claims: SsoClaims }
  | { ok: false; reason: "malformed" | "expired" | "future" };

/**
 * Fresh if within the token's exp (or iat + 5min fallback). `skewSeconds`
 * tolerates clock drift between the main server and the device.
 */
export function checkSsoFreshness(token: string, skewSeconds = 60): Freshness {
  const claims = decodeSsoClaims(token);
  if (!claims) return { ok: false, reason: "malformed" };

  const now = Math.floor(Date.now() / 1000);
  if (claims.iat - now > skewSeconds) return { ok: false, reason: "future" };

  const expiry = claims.exp ?? claims.iat + SSO_TTL_SECONDS;
  if (now - expiry > skewSeconds) return { ok: false, reason: "expired" };

  return { ok: true, claims };
}
