/**
 * A Codec encodes an outgoing request body and decodes an incoming response
 * body. Swapping the codec is how you change encryption without touching
 * anything else.
 *
 * Today: PlainCodec (JSON) is active for local dev, AesCodec is provided and
 * ready — flip ACTIVE_CODEC in net/config.ts to switch. Later, replace AesCodec
 * with a key-exchange variant and nothing else changes.
 */
export interface Codec {
  /** Returns { body, headers } to actually send. */
  encode(payload: unknown): Promise<{ body: string; headers: Record<string, string> }>;
  /** Given a raw response string, return the parsed JSON your app expects. */
  decode(raw: string): Promise<unknown>;
}

/** Plaintext JSON — used in local development. */
export class PlainCodec implements Codec {
  async encode(payload: unknown) {
    return {
      body: payload === undefined ? "" : JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    };
  }
  async decode(raw: string) {
    return raw ? JSON.parse(raw) : null;
  }
}
