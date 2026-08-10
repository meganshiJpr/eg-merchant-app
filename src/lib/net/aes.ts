import type { Codec } from "./codec";

/**
 * AES-CBC codec with a FIXED key + IV (today's requirement).
 *
 * IMPORTANT — this is deliberately isolated so it can be replaced wholesale:
 * when you later move to a per-session key (RSA handshake at login, rotating
 * IVs, GCM, request signing, etc.), you write a new Codec and swap it in
 * net/config.ts. api() callers and every feature stay identical.
 *
 * Uses the Web Crypto API (available in browsers and the WebView wrappers).
 *
 * NOTE: a fixed key shipped in the client bundle is NOT a real secret — it
 * only obfuscates traffic and pairs with HTTPS. That was discussed and
 * accepted for this phase. The backend must use the same key/IV/mode, and the
 * wire format below (base64 of ciphertext) must match the PHP side exactly.
 */

// TODO(backend): agree these with the PHP team. Read from env so they are not
// hard-baked and can differ per environment.
const KEY_UTF8 = process.env.NEXT_PUBLIC_AES_KEY ?? "0123456789abcdef0123456789abcdef"; // 32 bytes → AES-256
const IV_UTF8 = process.env.NEXT_PUBLIC_AES_IV ?? "abcdef9876543210"; // 16 bytes

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

let keyPromise: Promise<CryptoKey> | null = null;
function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      enc.encode(KEY_UTF8),
      { name: "AES-CBC" },
      false,
      ["encrypt", "decrypt"],
    );
  }
  return keyPromise;
}

export class AesCodec implements Codec {
  async encode(payload: unknown) {
    const key = await getKey();
    const plaintext = payload === undefined ? "" : JSON.stringify(payload);
    const ct = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: enc.encode(IV_UTF8) },
      key,
      enc.encode(plaintext),
    );
    // Wire format: { data: "<base64 ciphertext>" }. Adjust to match the PHP side.
    return {
      body: JSON.stringify({ data: b64encode(ct) }),
      headers: { "Content-Type": "application/json", "X-Enc": "aes-cbc" },
    };
  }

  async decode(raw: string) {
    if (!raw) return null;
    // Expect { data: "<base64 ciphertext>" } back; fall back to plain JSON if the
    // server ever returns unencrypted (e.g. error envelopes).
    let container: unknown;
    try {
      container = JSON.parse(raw);
    } catch {
      return null;
    }
    const cipherB64 =
      container && typeof container === "object" && "data" in container
        ? (container as { data: string }).data
        : null;
    if (!cipherB64) return container; // already plaintext JSON

    const key = await getKey();
    const pt = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: enc.encode(IV_UTF8) },
      key,
      b64decode(cipherB64),
    );
    const text = dec.decode(pt);
    return text ? JSON.parse(text) : null;
  }
}
