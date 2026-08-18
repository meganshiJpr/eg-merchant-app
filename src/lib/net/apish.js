import { post } from "./request";
import { useAuthStore } from "@/lib/auth/store";
import Cookies from "js-cookie";

const APISH_PATH = `/apisf/${process.env.NEXT_PUBLIC_ENCRYPT}`;
const DEVICE_TYPE = "mobileweb";
const DUMMY_FCM_TOKEN = "dummy_fcm_token_123456";

export function apish(requestUrl, params = {}, opts) {
  const token = Cookies.get("authToken") || useAuthStore.getState().token || "";
  const device = Cookies.get("authMobile") || "";
  const fcm_token = Cookies.get("fcmToken") || DUMMY_FCM_TOKEN;

  const body = {
    request_url: requestUrl,
    device_type: DEVICE_TYPE,
    token,
    device_id: device,
    fcm_token,
    ...params,
  };
  return post(APISH_PATH, body, { ...opts, auth: false });
}
