import { apish } from "@/lib/net/apish";

/**
 * fetchBalance → { success, message, data } where `data` is a JSON STRING:
 *   {"success":1,"message":"Success","data":"{\"earnings\":10.73}"}
 * request() returns the `data` field; here it's a string we must JSON.parse.
 */
export type Balance = { earnings: number };

export async function fetchBalance(): Promise<Balance> {
  const data = await apish<string | Balance>("fetchBalance");
  // Backend sends data as a JSON string; tolerate an already-parsed object too.
  const parsed = typeof data === "string" ? (JSON.parse(data) as Balance) : data;
  return { earnings: Number(parsed?.earnings ?? 0) };
}
