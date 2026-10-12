import { apish } from "@/lib/net/apish";



export async function UpdateMpin({
    old_mpin ="",
    new_mpin = "",
}) {
    try {
        const data = await apish("updateMpin", {
            old_mpin,
            new_mpin,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response mpin generated:", parsed);
        return parsed;
    } catch (error) {
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to update MPIN",
        };
    }
}


export async function getOtpForMpinReset({mobile = ""})
{
    try{
        const data = await apish("forgotMpinOtp",{mobile});
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch otp response :", parsed);
        return parsed;
    } catch (error) {
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to generate OTP",
        };
    }
}

export async function fetchMpinResetByOtp({
    otp = "",
    new_mpin = "",
    otp_token = "",
    mobile = "",
}) {
    try {
        const data = await apish("forgotMpin", {
            otp,
            new_mpin,
            otp_token,
            mobile,
        }); 
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response mpin reset by otp:", parsed);
        return parsed;
    } catch (error){
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to reset MPIN",
        };
    }
}



export async function fetchBankList(){
    try {
        const data = await apish("/mobile/banking", "banksList", {});
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response bank list:", parsed);
        return parsed;
    } catch (error) {
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to fetch bank list",
        };      
    }
}

export async function postBankDetails({
    ac_holder = "",
    ac_number = "",
    bank_name = "",
    ifsc_code = "",
    account_type="",
    mpin = "",
}) {
    try {
        const data = await apish("/mobile/banking", "addSelfBank", {
            ac_holder,
            ac_number,
            bank_name,
            ifsc_code,
            account_type,
            mpin,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch bank add details of the response :",parsed);
        return parsed;
    } catch (error) {
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to post bank details",
        };
    }
}

export async function getUserKyc() {
    try {
        const data = await apish("/mobile/banking", "getUserKyc", {});
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("getUserKyc response:", parsed);
        return parsed;
    } catch (error) {
        console.error("getUserKyc error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to fetch KYC details",
        };
    }
}

export async function generateCaptcha() {
    try {
        const data = await apish("/mobile/banking", "generateCaptcha", {});
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("generateCaptcha response:", parsed);
        return parsed;
    } catch (error) {
        console.error("generateCaptcha error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to generate captcha",
        };
    }
}

export async function sendAadharOtp({ aadhar_no = "", captcha = "", session_id = "" }) {
    try {
        const data = await apish("/mobile/banking", "sendAadharOtp", {
            aadhar_no,
            captcha,
            session_id,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("sendAadharOtp response:", parsed);
        return parsed;
    } catch (error) {
        console.error("sendAadharOtp error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to send Aadhaar OTP",
        };
    }
}

export async function verifyAadharOtp({ otp = "", session_id = "" }) {
    try {
        const data = await apish("/mobile/banking", "verifyAadharOtp", {
            otp,
            session_id,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("verifyAadharOtp response:", parsed);
        return parsed;
    } catch (error) {
        console.error("verifyAadharOtp error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to verify Aadhaar OTP",
        };
    }
}

export async function verifyPan({ pan = "", dob = "" }) {
    try {
        const data = await apish("/mobile/banking", "verifyPan", {
            pan,
            dob,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("verifyPan response:", parsed);
        return parsed;
    } catch (error) {
        console.error("verifyPan error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to verify PAN card",
        };
    }
}

export async function submitSelfieVerification({ selfie = "", lat = "", long = "", address = ""}) {
    try {
        const data = await apish("/mobile/banking", "submitSelfieVerification", {
            selfie,
            lat: lat,
            long: long,
            address: address,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("submitSelfieVerification response:", parsed);
        return parsed;
    } catch (error) {
        console.error("submitSelfieVerification error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to submit selfie verification",
        };
    }
}

export async function uploadVideoKyc({ video = "", lat = "", long = "", address = "" }) {
    try {
        const data = await apish("/mobile/banking", "uploadVideoKyc", {
            video,
            lat: lat,
            long: long,
            address: address,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("uploadVideoKyc response:", parsed);
        return parsed;
    } catch (error) {
        console.error("uploadVideoKyc error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to upload video KYC",
        };
    }
}

export async function videoKycScript() {
  try {
    const data = await apish("/mobile/banking", "videoKycScript");
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("videoKycScript response:", parsed);
    return parsed;
  } catch (error) {
    console.error("videokycScript error:", error);
        if (error?.data && typeof error.data === "object") {
            return error.data;
        }
        return {
            success: false,
            message: error?.message || "Failed to get video KYC Script",
        };
  }
}

export async function getKycTermsAndConditions() {
  try {
    const data = await apish("/merchant", "getKycTermsAndConditions", {});
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("getKycTermsAndConditions API response:", parsed);
    return parsed;
  } catch (error) {
    const response = error?.data;
      if (
      response?.message === "KYC details not found." ||
      error?.message === "KYC details not found."
    ) {
      return {
        success: 0,
        message: "KYC details not found.",
        error_type: "",
      };
    }
    console.error("getKycTermsAndConditions error:", error);
    if (error?.data && typeof error.data === "object") {
      return error.data;
    }
    return {
      success: false,
      message: error?.message || "Failed to fetch KYC terms & conditions",
    };
  }
}

export async function submitKycTermsAndConditions({
  kyc_terms_pdf,
  terms_accepted = true,
  lat = "",
  long = "",
}) {
  try {
    const data = await apish("/mobile/banking", "submitKycTermsAndConditions", {
      kyc_terms_pdf,
      terms_accepted,
      lat:lat,
      long:long,
    });
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("submitKycTermsAndConditions API response:", parsed);
    return parsed;
  } catch (error) {
    console.error("submitKycTermsAndConditions error:", error);
    if (error?.data && typeof error.data === "object") {
      return error.data;
    }
    return {
      success: false,
      message: error?.message || "Failed to submit KYC terms & conditions",
    };
  }
}




