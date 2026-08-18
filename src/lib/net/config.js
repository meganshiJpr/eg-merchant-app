import { PlainCodec } from "./codec";
import { AesCodec } from "./aes";
import { ApishCodec } from "./apishCodec";
import { HttpTransport } from "./httpTransport";
import { env } from "@/config/env";

/**
 * NEXT_PUBLIC_ENCRYPT selects the codec:
 *   "apish" | "apisi" → ApishCodec  (PayBy random-key AES-256-CBC + Ol header)
 *   "aes"   → AesCodec    (fixed key/IV)
 *   (unset) → PlainCodec  (plaintext JSON)
 */

const BASE_URL = env.apiBaseUrl;

function pickCodec() {
  switch (env.encryptMode) {
    case "apish": return new ApishCodec();
    case "aes": return new AesCodec();
    case "apisi": return new ApishCodec();
    default: return new PlainCodec();
  }
}

export const transport = new HttpTransport(BASE_URL, pickCodec());
