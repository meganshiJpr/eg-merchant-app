/**
 * Reads the SSO token + UTM/context params off the public /sso URL.
 * Tolerant of a few common token param aliases; narrow these once the exact
 * param names from the main server are confirmed.
 */
export type SsoParams = {
  ssoToken: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ref?: string;
  /** any unrecognized params, preserved so nothing from the URL is lost */
  extra?: Record<string, string>;
};

export function parseSsoParams(params: URLSearchParams): SsoParams | null {
  const ssoToken =
    params.get("sso_token") ?? params.get("token") ?? params.get("ssoToken");
  if (!ssoToken) return null;

  const known = new Set([
    "sso_token", "token", "ssoToken",
    "utm_source", "utm_medium", "utm_campaign", "ref",
  ]);
  const extra: Record<string, string> = {};
  params.forEach((v, k) => {
    if (!known.has(k)) extra[k] = v;
  });

  return {
    ssoToken,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    ref: params.get("ref") ?? undefined,
    extra: Object.keys(extra).length ? extra : undefined,
  };
}
