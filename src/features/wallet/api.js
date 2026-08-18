import { apish } from "@/lib/net/apish";

export async function fetchBalance() {
  const data = await apish("fetchBalance");
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return { earnings: Number(parsed?.earnings ?? 0) };
}

