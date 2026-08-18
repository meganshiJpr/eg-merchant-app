import { env } from "@/config/env";

/**
 * AES-CBC codec with a FIXED key + IV (today's requirement).
 *
 * Uses the Web Crypto API (available in browsers and the WebView wrappers).
 */

const KEY_UTF8 = env.aesKey;
const IV_UTF8 = env.aesIv;

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64encode(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

let keyPromise = null;
function getKey() {
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

export class AesCodec {
  async encode(payload) {
    const key = await getKey();
    const plaintext = payload === undefined ? "" : JSON.stringify(payload);
    const ct = await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: enc.encode(IV_UTF8) },
      key,
      enc.encode(plaintext),
    );
    return {
      body: JSON.stringify({ data: b64encode(ct) }),
      headers: { "Content-Type": "application/json", "X-Enc": "aes-cbc" },
    };
  }

  async decode(raw) {
    if (!raw) return null;
    let container;
    try {
      container = JSON.parse(raw);
    } catch {
      return null;
    }
    const cipherB64 =
      container && typeof container === "object" && "data" in container
        ? container.data
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
