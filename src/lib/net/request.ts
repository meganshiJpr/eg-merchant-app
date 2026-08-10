import { transport } from "./config";
import { useAuthStore } from "@/lib/auth/store";

/**
 * ── The common entry point for EVERY frontend→backend request. ──
 *
 * Features call request()/get()/post() only. They never see fetch, headers,
 * tokens, or encryption — all of that lives behind the Transport/Codec swapped
 * in net/config.ts.
 *
 * Backend response convention (PayBy):  { success: 0|1, message, data }
 *   success:1 → resolve with `data`
 *   success:0 → reject with ApiError(message)
 *
 * SESSION EXPIRY is handled centrally here so it applies to EVERY API on EVERY
 * page, and can be changed in one place:
 *   - HTTP 401, OR
 *   - success:0 with message "EXPIRED"
 *   → clear stored session (token/device/merchant) and send the user to login.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: unknown,
  ) {
    super(message);
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** false for endpoints that must NOT carry the login token (e.g. SSO verify). */
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

type Envelope = { success?: 0 | 1 | boolean; message?: string; data?: unknown; code?: string };

/**
 * Central session-expiry handler. Clears stored auth and redirects to the
 * public SSO/login screen. Kept as one function so the redirect target or
 * behavior (e.g. show a modal instead) can be changed in a single place.
 */
function handleSessionExpired() {
  useAuthStore.getState().clear();
  // Hard redirect so all in-memory React state (queries, stores) is dropped.
  if (typeof window !== "undefined" && window.location.pathname !== "/sso") {
    window.location.replace("/sso?expired=1");
  }
}

/** True when a success:0 envelope means the session is gone. */
function isExpiredMessage(message?: string): boolean {
  return (message ?? "").trim().toUpperCase() === "EXPIRED";
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, headers, signal } = opts;
  const token = auth ? useAuthStore.getState().token : null;

  let res;
  try {
    res = await transport.send({ method, path, body, headers, token, signal });
  } catch (e) {
    throw new ApiError(0, "NETWORK", "Network error. Please check your connection.", e);
  }

  // HTTP-level revoked/expired token.
  if (res.status === 401) {
    handleSessionExpired();
    throw new ApiError(401, "SESSION_EXPIRED", "Session expired. Please log in again.");
  }

  const payload = res.data as Envelope | null;

  // HTTP-level failure (5xx, 404, ...) with no usable envelope.
  if (!res.ok && (!payload || typeof payload !== "object")) {
    throw new ApiError(res.status, "HTTP_ERROR", "Something went wrong. Please try again.");
  }

  // Backend { success, message, data } envelope.
  if (payload && typeof payload === "object" && "success" in payload) {
    const ok = payload.success === 1 || payload.success === true;
    if (!ok) {
      // App-level session expiry (success:0, message "EXPIRED").
      if (isExpiredMessage(payload.message)) {
        handleSessionExpired();
        
        throw new ApiError(440, "SESSION_EXPIRED", "Session expired. Please log in again.", payload);
      }
      throw new ApiError(
        res.status || 200,
        payload.code ?? "API_ERROR",
        payload.message ?? "Request failed. Please try again.",
        payload,
      );
    }
    
    return payload.data as T;
  }

  // No envelope: pass the payload through unchanged.
  if (!res.ok) {
    throw new ApiError(res.status, "HTTP_ERROR", "Something went wrong. Please try again.");
  }
  return payload as T;
}

export const get = <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
  request<T>(path, { ...opts, method: "GET" });

export const post = <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
  request<T>(path, { ...opts, method: "POST", body });
