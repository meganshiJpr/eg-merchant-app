/**
 * A Codec encodes an outgoing request body and decodes an incoming response
 * body. Swapping the codec is how you change encryption without touching
 * anything else.
 */

/** Plaintext JSON — used in local development. */
export class PlainCodec {
  async encode(payload) {
    return {
      body: payload === undefined ? "" : JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    };
  }
  async decode(raw) {
    return raw ? JSON.parse(raw) : null;
  }
}
