import type { Transport } from "./transport";
import type { Codec } from "./codec";
import { PlainCodec } from "./codec";
import { AesCodec } from "./aes";
import { ApishCodec } from "./apishCodec";
import { HttpTransport } from "./httpTransport";

/**
 * ── The one file you touch to change how requests work. ──
 *
 * NEXT_PUBLIC_ENCRYPT selects the codec:
 *   "apish" → ApishCodec  (PayBy random-key AES-256-CBC + Ol header)  ← production
 *   "aes"   → AesCodec    (fixed key/IV, earlier experiment)
 *   (unset) → PlainCodec  (plaintext JSON, local dev)
 *
 * Change base URL: NEXT_PUBLIC_API_BASE_URL in .env.
 * Nothing else imports codec/transport directly, so changes here propagate
 * everywhere with zero edits elsewhere.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function pickCodec(): Codec {
  switch (process.env.NEXT_PUBLIC_ENCRYPT) {
    case "apish": return new ApishCodec();
    case "aes": return new AesCodec();
    default: return new PlainCodec();
  }
}

export const transport: Transport = new HttpTransport(BASE_URL, pickCodec());
