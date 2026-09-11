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

export async function fecthMpinResetByOtp({
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