// lastRechargeHistory  - type = Prepaid
import { apish } from "@/lib/net/apish";

export async function fetchRechargeHistory() {
  const data = await apish("lastRechargeHistory", { type: "Prepaid" });
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return parsed;
}
