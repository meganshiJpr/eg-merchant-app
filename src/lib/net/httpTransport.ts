import type { Transport, TransportRequest, TransportResponse } from "./transport";
import type { Codec } from "./codec";

/**
 * The only place fetch() is called. It:
 *  - asks the active Codec to encode the body (plain today, AES when swapped),
 *  - attaches the Bearer token + any per-call headers,
 *  - asks the Codec to decode the response.
 *
 * Changing base URL, timeouts, retries, or the cipher never touches callers.
 */
export class HttpTransport implements Transport {
  constructor(
    private baseUrl: string,
    private codec: Codec,
  ) {}

  async send(req: TransportRequest): Promise<TransportResponse> {
    const { body, headers: codecHeaders } = await this.codec.encode(req.body);

    const res = await fetch(`${this.baseUrl}${req.path}`, {
      method: req.method,
      signal: req.signal,
      headers: {
        ...codecHeaders,
        ...(req.token ? { Authorization: `Bearer ${req.token}` } : {}),
        ...req.headers,
      },
      body: req.method === "GET" || body === "" ? undefined : body,
    });

    const raw = await res.text();
    const data = await this.codec.decode(raw).catch(() => null);
    return { ok: res.ok, status: res.status, data };
  }
}
