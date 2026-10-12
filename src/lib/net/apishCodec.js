/**
 * PayBy "apish" transport codec — mirrors the backend decryptRequest() exactly.
 */

const enc = new TextEncoder();

function toHex(bytes) {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}
function randHex(nBytes) {
  const b = new Uint8Array(nBytes);
  crypto.getRandomValues(b);
  return toHex(b);
}
function b64(buf) {
  const u = new Uint8Array(buf);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s);
}
async function sha512Hex(input) {
  const d = await crypto.subtle.digest("SHA-512", enc.encode(input));
  return toHex(new Uint8Array(d));
}
async function hkdfSha256(ikm, saltHexString, info, len) {
  const base = await crypto.subtle.importKey("raw", enc.encode(ikm), "HKDF", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode(saltHexString), info: enc.encode(info) },
    base,
    len * 8,
  );
}

export class ApishCodec {
  async encode(payload) {
    if (typeof FormData !== "undefined" && payload instanceof FormData) {
      return {
        body: payload,
        headers: {},
      };
    }
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

  async decode(raw) {
    return raw ? JSON.parse(raw) : null;
  }
}
