/**
 * Native Web Crypto Payload Encryption (AES-256-CBC + HKDF-SHA256 + SHA-512)
 * Returns { data: cipherBase64, base64: olHeaderBase64 }
 */

const enc = new TextEncoder();

function toHex(bytes) {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

function randHex(nBytes) {
  const b = new Uint8Array(nBytes);
  const cryptoObj = typeof window !== "undefined" && window.crypto ? window.crypto : globalThis.crypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues(b);
  } else {
    for (let i = 0; i < nBytes; i++) b[i] = Math.floor(Math.random() * 256);
  }
  return toHex(b);
}

function arrayBufferToBase64(buf) {
  const u = new Uint8Array(buf);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s);
}

export async function encryptRandom(payload) {
  try {
    const mt = randHex(16);
    const no = randHex(24);
    const gb = randHex(32);

    const cryptoObj = typeof window !== "undefined" && window.crypto ? window.crypto : globalThis.crypto;
    const saltBuf = await cryptoObj.subtle.digest("SHA-512", enc.encode(no + mt + gb));
    const salt = toHex(new Uint8Array(saltBuf));

    const baseKey = await cryptoObj.subtle.importKey(
      "raw",
      enc.encode(`${mt}:${no}:${gb}`),
      "HKDF",
      false,
      ["deriveBits"]
    );
    const keyBytes = await cryptoObj.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: enc.encode(salt), info: enc.encode("fghjkijjkmlnnnkj") },
      baseKey,
      256
    );

    const key = await cryptoObj.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]);

    const ht = new Uint8Array(16);
    cryptoObj.getRandomValues(ht);

    const plaintext = payload === undefined ? "" : JSON.stringify(payload);
    const cipher = await cryptoObj.subtle.encrypt({ name: "AES-CBC", iv: ht }, key, enc.encode(plaintext));

    const str = `${toHex(ht)}.${mt}.${no}.${gb}`;
    const base64 = btoa(str);

    return {
      data: arrayBufferToBase64(cipher),
      base64,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

export default encryptRandom;
