import { transport } from "./config";
import { useAuthStore } from "@/lib/auth/store";
import { useSessionExpiryStore } from "@/lib/auth/sessionExpiryStore";
import Cookies from "js-cookie";

export class ApiError extends Error {
  constructor(status, code, message, data) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Central session-expiry handler. It blocks the app with a global overlay;
 * the user must close the app/tab and start a fresh SSO session.
 */
function handleSessionExpired() {
  useSessionExpiryStore.getState().showExpired();
  useAuthStore.getState().clear();
  if (typeof window !== "undefined") {
    Cookies.remove("authToken");
    Cookies.remove("authMobile");
  }
}

/** True when a success:0 envelope means the session is gone. */
function isExpiredMessage(message) {
  return ["EXPIRED", "SESSION EXPIRED", "SESSION_EXPIRED", "TOKEN EXPIRED", "TOKEN_EXPIRED"].includes(
    String(message ?? "").trim().toUpperCase(),
  );
}

export async function request(path, opts = {}) {
  const { method = "GET", body, auth = true, headers, signal } = opts;

  // Do not let additional requests run once a confirmed expiry has blocked
  // the application. This avoids repeated API errors behind the overlay.
  if (useSessionExpiryStore.getState().expired) {
    throw new ApiError(440, "SESSION_EXPIRED", "Session expired.");
  }

  const token = auth ? useAuthStore.getState().token : null;

  let res;
  try {
    res = await transport.send({ method, path, body, headers, token, signal });
  } catch (e) {
    console.error(` API Transport Failure [${method} ${path}]:`, e);
    throw new ApiError(0, "NETWORK", "Network error. Please check your connection.", e);
  }

  // HTTP-level revoked/expired token.
  if ([401, 419, 440].includes(res.status)) {
    handleSessionExpired();
    throw new ApiError(401, "SESSION_EXPIRED", "Session expired. Please log in again.");
  }

  
  const payload = res.data;

  // HTTP-level failure (5xx, 404, ...) with no usable envelope.
  if (!res.ok && (!payload || typeof payload !== "object")) {
    throw new ApiError(res.status, "HTTP_ERROR", "Something went wrong. Please try again.");
  }

  // Backend { success, message, data } envelope.
  if (payload && typeof payload === "object" && "success" in payload) {
    const ok = payload.success === 1 || payload.success === true;
    if (!ok) {
      // App-level session expiry (success:0, message "EXPIRED").
      if (isExpiredMessage(payload.message) || isExpiredMessage(payload.code)) {
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
    
    return payload.data;
  }

  // No envelope: pass the payload through unchanged.
  if (!res.ok) {
    throw new ApiError(res.status, "HTTP_ERROR", "Something went wrong. Please try again.");
  }
  return payload;
}

export const get = (path, opts) =>
  request(path, { ...opts, method: "GET" });

export const post = (path, body, opts) =>
  request(path, { ...opts, method: "POST", body });
