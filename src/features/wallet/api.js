import { apish } from "@/lib/net/apish";

export async function fetchBalance() {
  const data = await apish("fetchBalance");
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return { earnings: Number(parsed?.earnings ?? 0) };
}

export async function fetchWalletSetting() {
  try {
    const data = await apish("getPaymentSetting");
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("response of the wallet setting", parsed);

    const msg = String(parsed?.message || parsed?.msg || parsed?.kyc_message || parsed?.data?.message || "").trim();
    const isKycMessage = Boolean(
      msg && (msg.toLowerCase().includes("complete your kyc") || msg.toLowerCase().includes("kyc"))
    );

    if (isKycMessage || parsed?.isKycNotice) {
      return {
        ...parsed,
        isKycNotice: true,
        kycMessage: msg || "Complete your KYC to add balance.",
      };
    }

    return parsed;
  } catch (error) {
    const errData = error?.data || {};
    const errMsg = String(error?.message || errData?.message || errData?.msg || "").trim();
    const isKycErr = Boolean(
      errMsg && (errMsg.toLowerCase().includes("complete your kyc") || errMsg.toLowerCase().includes("kyc"))
    );

    if (isKycErr) {
      return {
        isKycNotice: true,
        kycMessage: errMsg || "Complete your KYC to add balance.",
        ...(typeof errData === "object" ? errData : {}),
      };
    }

    console.error("fetchWalletSetting error:", error);
    throw error;
  }
}

export async function fetchManualDepositDetails() {
  try {
    const data = await apish("bankDetails");
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("response of the manual bank wallet details", parsed);

    const msg = String(parsed?.message || parsed?.msg || parsed?.kyc_message || parsed?.data?.message || "").trim();
    const isKycMessage = Boolean(
      msg && (msg.toLowerCase().includes("complete your kyc") || msg.toLowerCase().includes("kyc"))
    );

    if (isKycMessage || parsed?.isKycNotice) {
      return {
        ...parsed,
        isKycNotice: true,
        kycMessage: msg || "Complete your KYC for add balance.",
        payment_details: [],
        payment_modes: [],
      };
    }

    return parsed;
  } catch (error) {
    const errData = error?.data || {};
    const errMsg = String(error?.message || errData?.message || errData?.msg || "").trim();
    const isKycErr = Boolean(
      errMsg && (errMsg.toLowerCase().includes("complete your kyc") || errMsg.toLowerCase().includes("kyc"))
    );

    if (isKycErr) {
      return {
        isKycNotice: true,
        kycMessage: errMsg || "Complete your KYC for add balance.",
        payment_details: [],
        payment_modes: [],
        ...(typeof errData === "object" ? errData : {}),
      };
    }

    console.error("fetchManualDepositDetails error:", error);
    throw error;
  }
}

export async function FetchfundRequest({ mode, bank, amount, ref_no, comment }) {
  try {
    const data = await apish("fundRequest", {
      mode,
      bank,
      amount,
      ref_no,
      comment,
      version_code: 65,
    });
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error) {
    const errData = error?.data || {};
    const errMsg = String(error?.message || errData?.message || "").trim();
    if (errMsg || errData?.message) {
      return {
        success: 0,
        message: errMsg || errData?.message || "Failed to submit deposit request.",
        ...(typeof errData === "object" ? errData : {}),
      };
    }
    throw error;
  }
}

