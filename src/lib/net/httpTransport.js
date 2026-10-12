/**
 * The only place fetch() is called. It:
 *  - asks the active Codec to encode the body,
 *  - attaches the Bearer token + any per-call headers,
 *  - asks the Codec to decode the response.
 */
export class HttpTransport {
  constructor(baseUrl, codec) {
    this.baseUrl = baseUrl;
    this.codec = codec;
  }

  async send(req) {
    const { body, headers: codecHeaders } = await this.codec.encode(req.body);

    const base = req.baseUrl || this.baseUrl;
    const url = `${base.replace(/\/$/, "")}/${req.path.replace(/^\//, "")}`;

    const res = await fetch(url, {
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
