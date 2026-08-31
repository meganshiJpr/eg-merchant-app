import { apish } from "@/lib/net/apish";

const DASHBOARD_SESSION_KEY = "dashboard_data_session";
const Contractor_LIST_SESSION_KEY = "contractor_list_session";

export async function fetchDashboardData() {
  try {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(DASHBOARD_SESSION_KEY);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          return parsedCache;
        } catch {
        }
      }
    }
    // Fetch from network if not present in session
    const data = await apish("dashboardData");
    console.log("dashboardData response:", data);

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("dashboardData parsed:", parsed);

    if (typeof window !== "undefined" && parsed) {
      try {
        sessionStorage.setItem(DASHBOARD_SESSION_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.warn("Could not save dashboardData to sessionStorage:", err);
      }
    }

    return parsed;
  } catch (error) {
    console.error("fetchDashboardData failed:", error);
    throw error;
  }
}

export async function fetchOperatorsList() {
try {
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(Contractor_LIST_SESSION_KEY);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          console.log(" Loaded operatorsList from sessionStorage:", parsedCache);
          return parsedCache;
        } catch {
        }
      }
    }
    // Fetch from network if not present in session
    const data = await apish("operatorsList");
    console.log("operatorsList response:", data);

    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    console.log("operatorsList parsed:", parsed);

    if (typeof window !== "undefined" && parsed) {
      try {
        sessionStorage.setItem(Contractor_LIST_SESSION_KEY, JSON.stringify(parsed));
      } catch (err) {
        console.warn("Could not save operatorsList to sessionStorage:", err);
      }
    }

    return parsed;
  } catch (error) {
    console.warn("fetchOperatorsList network fetch failed:", error);
    if (error?.data && typeof error.data === "object") {
      return error.data;
    }
    return null;
  }
}
