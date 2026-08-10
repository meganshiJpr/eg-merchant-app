/** Values the verify endpoint expects as POST data alongside the token. */
export type ClientMeta = { userAgent: string; browser: string };

export function getClientMeta(): ClientMeta {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  // order matters: Edge/Opera UAs also contain "Chrome"/"Safari" tokens
  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  return { userAgent: ua, browser };
}
