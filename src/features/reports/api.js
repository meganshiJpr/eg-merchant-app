import { apish } from "@/lib/net/apish";

export async function fetchTransactionHistory({
    page = 1,
    from = "",
    to = "",
  paymentStatus = "",
  serviceType = "",
  keyword = "",
} = {}) {
  try {
    const data = await apish("rechargeHistory", {
      page,
      from,
      to,
      paymentStatus,
      serviceType,
      keyword,
    });
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("Fetch response of transaction history data:", parsed);

    return parsed;
  } catch (error) {
    if (error?.data && typeof error.data === "object" && ("success" in error.data || "message" in error.data)) {
      console.log("fetchTransactionHistory caught ApiError payload as valid business response:", error.data);
      return error.data;
    }
    console.error("fetchTransactionHistory Error:", error);
    throw error;
  }
}
  
export async function fetchTransactionHistorySuccessDetails({order_id}) {
    try {
        const data = await apish("rechargeDetails", {
            order_id
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response of transaction history success details:", parsed);

        return parsed;
    } catch (error) {
        console.error("fetchTransactionHistorySuccessDetails Error:", error);
        throw error;
    }
}  

export async function fetchWalletHistory({
    page = 1,
    from = "",
    to = "",
    keyword = "",
}) {
    try {
        const data = await apish("walletHistory", {
            page,
            from,
            to,
            keyword,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response of wallet history:", parsed);
        return parsed;
    } catch (error) {
        console.error("fetchWalletHistory Error:", error);
        throw error;
    }
}

export const fetchWalletHistoy = fetchWalletHistory;

export async function fetchDisputeComplainHistory({
    page = 1,
    from = "",
    to = "",
    keyword = "",
}) {
    try {
        const data = await apish("complainHistory", {
            page,
            from,
            to,
            keyword,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response of dispute complain history:", parsed);
        return parsed;
    } catch (error) {
        console.error("fetchDisputeComplainHistory Error:", error);
        throw error;
    }
}

export async function fetchDepositHistory({
    page = 1,
    from = "",
    to = "",
    keyword = "",
    paymentStatus = "",
    checkBackup = null,
} = {}) {
    try {
        const payload = {
            page,
            from,
            to,
            keyword,
            paymentStatus,
        };
        if (checkBackup) {
            payload.checkBackup = checkBackup;
        }
        const data = await apish("onlineDepositHistory", payload);
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response of deposit history:", parsed);
        return parsed;
    } catch (error) {
        console.error("fetchDepositHistory Error:", error);
        throw error;
    }
}

    export async function fetchRequestBalance({order_id,amount,reason}) {
        try {
            const data = await apish("refundBalance", {
                order_id,
                amount,
                reason
            });
            const parsed = typeof data === "string" ? JSON.parse(data) : data;
            console.log("Fetch response of request balance:", parsed);
            return parsed;
        } catch (error) {
            console.error("fetchRequestBalance Error:", error);
            throw error;
        }
}


export async function fetchManualDepositRequests({
    page = 1,
    from = "",
    to = "",
    keyword = "",
    paymentStatus = "",
}) {
    try {
        const data = await apish("fundRequestHistory", {
            page,
            from,
            to,
            keyword,
            paymentStatus,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response of manual deposit requests:", parsed);
        return parsed;
    } catch (error) {
        console.error("fetchManualDepositRequests Error:", error);
        throw error;
    }
} 

export async function fetchRefundReport({
    page = 1,
    from = "",
    to = "",
    keyword = "",
    paymentStatus = "",
}) {
    try {
        const data = await apish("refundLedgerHistory", {
            page,
            from,
            to,
            keyword,
            paymentStatus,
        });
        const parsed = typeof data === "string" ? JSON.parse(data) : data;
        console.log("Fetch response of refund report:", parsed);
        return parsed;
    } catch (error) {
        console.error("fetchRefundReport Error:", error);
        throw error;
    }
}
// if (typeof window !== "undefined") {
//   window.fetchTransactionHistorySuccessDetails = fetchTransactionHistorySuccessDetails;
// }