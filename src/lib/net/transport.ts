/**
 * Transport contract. The request layer talks to *a* Transport; it never
 * knows whether the body is plaintext JSON, AES-encrypted, signed, etc.
 *
 * To change how data goes over the wire later (new cipher, new key exchange,
 * request signing, compression...) you implement a new Transport and swap it
 * in ONE place (net/config.ts). No feature code and no api() callers change.
 */
export type TransportRequest = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  /** Already-serializable payload (plain object). Encoding is the transport's job. */
  body?: unknown;
  /** Extra headers a caller may add (rare). Auth header is added centrally. */
  headers?: Record<string, string>;
  /** Bearer token to attach, if the caller is authenticated. */
  token?: string | null;
  signal?: AbortSignal;
};

export type TransportResponse = {
  ok: boolean;
  status: number;
  /** Decoded, ready-to-use JSON payload (transport has already decrypted/parsed). */
  data: unknown;
};

export interface Transport {
  send(req: TransportRequest): Promise<TransportResponse>;
}
