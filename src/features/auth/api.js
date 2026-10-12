import { post } from "@/lib/net/request";
import { apish } from "@/lib/net/apish";

export function verifySso(ssoToken, meta, signal) {
  const path = `/merchant/verifyJwt?token=${encodeURIComponent(ssoToken)}`;
  return post(
    path,
    { user_agent: meta.userAgent, browser: meta.browser },
    { auth: false, signal },
  );
}

export async function generateProfileOtp({ tempToken }) {
  try {
    const data = await apish(
      "/merchant",
      "generate_otp",
      { token: tempToken }
    );
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("generateProfileOtp response:", parsed);
    return parsed;
  } catch (error) {
    console.error("generateProfileOtp error:", error);
    throw error;
  }
}

export async function submitMerchantOnboard(payload) {
  try {
    const data = await apish(
      "/merchant",
      "merchant_onboard",
      payload
    );
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("submitMerchantOnboard response:", parsed);
    return parsed;
  } catch (error) {
    console.error("submitMerchantOnboard error:", error);
    throw error;
  }
}

export async function getCityDropdownByStateId({ state_id = "",tempToken }) {
  try {
    const id = state_id;
    const data = await apish(
      "/merchant",
      "getcityDropdownByStateId",
      { state_id: id, token:tempToken }
    );
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("getcityDropdownByStateId response:", parsed);
    return parsed;
  } catch (error) {
    console.error("getcityDropdownByStateId error:", error);
    if (error?.data && typeof error.data === "object") {
      return error.data;
    }
    return {
      success: false,
      message: error?.message || "Failed to fetch cities",
    };
  }
}
