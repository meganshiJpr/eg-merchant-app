import type { Codec } from "./codec";

/**
 * PayBy "apish" transport codec — mirrors the backend decryptRequest() exactly
 * (verified by round-trip against a reimplementation of the PHP side).
 *
 *   mt = random 16 bytes hex, no = random 24 bytes hex, gb = random 32 bytes hex
 *   salt = SHA512_hex(no + mt + gb)                       // hex string used as salt bytes
 *   key  = HKDF-SHA256(ikm=`${mt}:${no}:${gb}`, salt, info="fghjkijjkmlnnnkj", 32)
 *   iv   = random 16 bytes
 *   data = base64( AES-256-CBC-encrypt( JSON(payload), key, iv ) )   // ciphertext only
 *   Ol   = base64( `${ivHex}.${mt}.${no}.${gb}` )                    // sent as a header
 *
 * The server rebuilds the key from the Ol header and decrypts `data`.
 * Responses are the plaintext { success, message, data } envelope, so
 * decode = JSON.parse (data may itself be a JSON string — callers parse it).
 *
 * SWAP NOTE: the entire scheme lives in this file. If crypto changes again,
 * replace this codec and flip net/config.ts — no feature/request() edits.
 */

const enc = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}
function randHex(nBytes: number): string {
  const b = new Uint8Array(nBytes);
  crypto.getRandomValues(b);
  return toHex(b);
}
function b64(buf: ArrayBuffer): string {
  const u = new Uint8Array(buf);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s);
}
async function sha512Hex(input: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-512", enc.encode(input));
  return toHex(new Uint8Array(d));
}
async function hkdfSha256(ikm: string, saltHexString: string, info: string, len: number): Promise<ArrayBuffer> {
  const base = await crypto.subtle.importKey("raw", enc.encode(ikm), "HKDF", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(saltHexString), info: enc.encode(info) },
    base,
    len * 8,
  );
}

export class ApishCodec implements Codec {
  async encode(payload: unknown) {
    const mt = randHex(16);
    const no = randHex(24);
    const gb = randHex(32);

    const salt = await sha512Hex(no + mt + gb);
    const keyBytes = await hkdfSha256(`${mt}:${no}:${gb}`, salt, "fghjkijjkmlnnnkj", 32);
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]);

    const iv = new Uint8Array(16);
    crypto.getRandomValues(iv);

    const plaintext = payload === undefined ? "" : JSON.stringify(payload);
    const cipher = await crypto.subtle.encrypt({ name: "AES-CBC", iv }, key, enc.encode(plaintext));

    const ol = btoa(`${toHex(iv)}.${mt}.${no}.${gb}`);
    return {
      body: JSON.stringify({ data: b64(cipher) }),
      headers: { "Content-Type": "application/json", Ol: ol },
    };
  }

  async decode(raw: string) {
    return raw ? JSON.parse(raw) : null;
  }
}
