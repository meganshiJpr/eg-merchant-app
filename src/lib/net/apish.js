import { post } from "./request";
import { useAuthStore } from "@/lib/auth/store";
import { ApishCodec } from "./apishCodec";
import Cookies from "js-cookie";

const DEFAULT_APISH_BASE = `/apisf/${process.env.NEXT_PUBLIC_ENCRYPT}`;
const DEVICE_TYPE = "mobileweb";
const DUMMY_FCM_TOKEN = "dummy_fcm_token_123456";
const BANK_API_URL = "/mobile/banking";
const MERCHANT_API_URL = "/merchant";

export async function apish(...args) {
  let baseUrl;
  let requestUrl;
  let params = {};
  let opts = {};

  // 1. Signature Resolution
  if (typeof args[0] === "string" && typeof args[1] === "string" && args[0].startsWith("/")) {
    baseUrl = args[0];
    requestUrl = args[1];
    params = args[2] || {};
    opts = args[3] || {};
  } else {
    requestUrl = args[0];
    params = args[1] || {};
    opts = args[2] || {};

    if (opts.baseUrl) {
      baseUrl = opts.baseUrl;
    } else if (opts.isMerchantApi) {
      baseUrl = MERCHANT_API_URL;
    } else if (opts.isBankApi) {
      baseUrl = BANK_API_URL;
    } else if (opts.endpoint) {
      baseUrl = opts.endpoint;
    } else {
      baseUrl = DEFAULT_APISH_BASE;
    }
  }

  // 2. Check if operation name should be appended to URL path (Merchant pre-login APIs)
  const isMerchant = opts.isMerchantApi || baseUrl === MERCHANT_API_URL || ["generate_otp", "merchant_onboard"].includes(requestUrl);
  const appendOp = opts.appendRequestUrl !== undefined ? opts.appendRequestUrl : isMerchant;

  // 3. Construct Path
  const targetPath = appendOp ? `${baseUrl.replace(/\/$/, "")}/${requestUrl}` : baseUrl;

  // 4. Endpoint Resolution (mainUrl / API_PROXY)
  let endpoint;
  if (opts.endpoint) {
    endpoint = opts.endpoint;
  } else if (opts.mainUrl) {
    const cleanMain = opts.mainUrl.replace(/\/$/, "");
    const cleanPath = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
    endpoint = `${cleanMain}${cleanPath}`;
  } else {
    const cleanPath = targetPath.replace(/^\/api-proxy/, "").replace(/\/$/, "");
    const rootPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    endpoint = `${rootPath}`;
  }

  // 5. Auth Context & Payload
  const authState = typeof window !== "undefined" ? useAuthStore.getState() : {};
  const token = params.token || Cookies.get("authToken") || authState?.token || "";
  const device = params.device_id || Cookies.get("authMobile") || authState?.device || authState?.merchant?.mobile || "";
  const fcm_token = params.fcm_token || Cookies.get("fcmToken") || DUMMY_FCM_TOKEN;
  const currentLang = typeof window !== "undefined" ? (localStorage.getItem("user_lang") || "en") : "en";

  const rawBody = {
    request_url: requestUrl,
    device_type: DEVICE_TYPE,
    token,
    device_id: device,
    fcm_token,
    lang: currentLang,
    ...params,
  };

  console.log("========== APISH REQUEST BEFORE ENCRYPTION ==========");
  console.log("Endpoint:", endpoint);
  console.log("Request URL:", requestUrl);
  console.log("Raw Body:", rawBody);
  console.log("Token:", rawBody?.token);
  console.log("Metadata:", rawBody);
  console.log("======================================================");

  const hasFile = Object.values(rawBody).some(
    (val) => (typeof File !== "undefined" && val instanceof File) || (typeof Blob !== "undefined" && val instanceof Blob)
  );

  if (hasFile) {
    const metadata = {};
    const files = {};

    const knownFileKeys = ["kyc_terms_pdf", "selfie", "video", "document", "file", "image"];

    Object.keys(rawBody).forEach((key) => {
      const val = rawBody[key];
      if ((typeof File !== "undefined" && val instanceof File) || (typeof Blob !== "undefined" && val instanceof Blob)) {
        files[key] = val;
      } else if (!knownFileKeys.includes(key)) {
        metadata[key] = val;
      }
    });

    const codec = new ApishCodec();
    const encoded = await codec.encode(metadata);
    let encryptedDataString = "";
    try {
      const parsed = JSON.parse(encoded.body);
      encryptedDataString = parsed.data || encoded.body;
    } catch (e) {
      encryptedDataString = encoded.body;
    }

    const formData = new FormData();
    formData.append("data", encryptedDataString);

    Object.keys(files).forEach((key) => {
      formData.append(key, files[key]);
    });

    const hybridHeaders = {
      ...opts.headers,
      ...(encoded.headers?.Ol ? { Ol: encoded.headers.Ol } : {}),
    };

    console.log("========== HYBRID ENCRYPTED FORMDATA REQUEST ==========");
    console.log("Endpoint:", endpoint);
    console.log("Request URL:", requestUrl);
    console.log("Encrypted Metadata String ('data'):", encryptedDataString);
    console.log("Attached Ol Header:", encoded.headers?.Ol);
    console.log("Raw File Keys Appended:", Object.keys(files));
    console.log("All FormData Keys & Values:");
    for (let pair of formData.entries()) {
      console.log(
        `  -> ${pair[0]}:`,
        pair[1] instanceof File ? `File(${pair[1].name}, ${pair[1].size} bytes)` : pair[1]
      );
    }
    console.log("=======================================================");

    return post(endpoint, formData, { ...opts, headers: hybridHeaders, auth: false });
  }

  let finalBody = rawBody;
  if (opts.isFormData) {
    const formData = new FormData();
    Object.keys(rawBody).forEach((key) => {
      if (rawBody[key] !== undefined && rawBody[key] !== null) {
        formData.append(key, rawBody[key]);
      }
    });
    finalBody = formData;
  }

  if (process.env.NODE_ENV !== "production" || requestUrl === "generate_otp") {
    console.log("Endpoint:", endpoint);
    console.log("Request URL:", requestUrl);
  }

  return post(endpoint, finalBody, { ...opts, auth: false });
}