export function parseSsoParams(params) {
  const ssoToken =
    params.get("sso_token") ?? params.get("token") ?? params.get("ssoToken");
  if (!ssoToken) return null;

  const known = new Set([
    "sso_token", "token", "ssoToken",
    "utm_source", "utm_medium", "utm_campaign", "ref",
  ]);
  const extra = {};
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
 