import { post, type RequestOptions } from "./request";
import { useAuthStore } from "@/lib/auth/store";

/**
 * Every PayBy "apish" call goes to ONE fixed URL; the backend routes by the
 * `request_url` field inside the (encrypted) body. This helper injects that
 * envelope so features just say: apish("fetchBalance", { ...params }).
 *
 *   POST {BASE}/apisf/apish
 *   body(before encryption) = { request_url, device_type, token, ...params }
 *   → apishCodec encrypts to { data } + Ol header
 *   → response envelope { success, message, data } is unwrapped by request()
 *
 * device_type is "mobileweb" for the web/WebView build (backend allow-list:
 * android | mobileweb | ios).
 */

const APISH_PATH = "/apisf/apish";
const DEVICE_TYPE = "mobileweb";

export function apish<T>(
  requestUrl: string,
  params: Record<string, unknown> = {},
  opts?: Omit<RequestOptions, "method" | "body">,
) {
  const token = useAuthStore.getState().token ?? "";
  const body = {
    request_url: requestUrl,
    device_type: DEVICE_TYPE,
    token,
    ...params,
  };
  // auth:false — the token travels INSIDE the encrypted payload, not as a
  // separate Bearer header (the backend reads decrypted->token).
  return post<T>(APISH_PATH, body, { ...opts, auth: false });
}
