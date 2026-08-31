import { apish } from "@/lib/net/apish";

export async function fetchRechargeHistory(type = "Prepaid") {
  const data = await apish("lastRechargeHistory", { type });
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return parsed;
}


export async function fetchOperatorPlan(number) {
  const data = await apish("findOperatorCircle", { number });
  const parsed = typeof data === "string" ? JSON.parse(data) : data;

  console.log("Operator Plan Response:", parsed);

  return parsed;
}


export async function fetchPrepaidPlans({operator, circle, number, session_id}) {
  try {
    const data = await apish("fetchPrepaidPlans", {
      operator,
      circle,
      number,
      session_id,
    });

    const parsed = typeof data === "string" ? JSON.parse(data) : data;

    console.log("Prepaid Plans Response:", parsed);

    return parsed;
  } catch (error) {
    console.error("fetchPrepaidPlans Error:", error);
    throw error;
  }
}

export async function fetchPaymentDetails({
  amount,
  session_id,
  operator,
  number,
  type = "Prepaid",
  circle,
  field1 = "",
  field2 = "",
  field3 = "",
  field4 = "",
  refresh = false,
  billDetails = "",
  biometric_enabled = 0,
  is_key_active = 0,
}) {
  try {
    const data = await apish("getPaymentDetails", {
      amount,
      session_id,
      operator,
      number,
      type,
      circle,
      field1,
      field2,
      field3,
      field4,
      refresh,
      billDetails,
      biometric_enabled,
      is_key_active,
    });

    const parsed = typeof data === "string" ? JSON.parse(data) : data;

    console.log("Payment Details Response:", parsed);

    return parsed;
  } catch (error) {
    console.error("fetchPaymentDetails Error:", error);
    throw error;
  }
}

export async function fetchBillerinfo({ operator, number }) {
  try {
    const data = await apish("dthCustomerInfo", {
      operator: String(operator),
      number: String(number),
    });
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("dthCustomerInfo API Response:", parsed);

    return parsed;
  } catch (error) {
    console.error("fetchBillerinfo Error:", error);
    throw error;
  }
}



export async function fetchBillOperatorDetails({operator}){
  try {
    const data = await apish("operatorDetails",{
      operator:String(operator),
    });
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("electricty and other info response",parsed);

    return parsed;
  } catch (error) {
     console.error("fetchotherbillInfo Error:", error);
    throw error;
  }
}


export async function fetchOperatorBillInfo({number,operator,field1,type,field2,field3,field4}){
  try {
    const data = await apish("fetchBillInfo",{
      number,
      operator:String(operator),
      field1,
      type,
      field2,
      field3,
      field4,
    });
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("Fetch response of the other bills services",parsed);

    return parsed;
  } catch (error) {
    if (error?.data && typeof error.data === "object" && ("success" in error.data || "message" in error.data)) {
      console.log("fetchOperatorBillInfo caught ApiError payload as valid business response:", error.data);
      return error.data;
    }
    console.error("fetchotherbillInfo Error:", error);
    throw error;
  }
}

if (typeof window !== "undefined") {
  window.fetchOperatorBillInfo = fetchOperatorBillInfo;
}

