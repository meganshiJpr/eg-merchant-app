/**
 * Formatting Utility Helpers
 *
 * Centralizes currency and date formatting used across features and components.
 */

/** Formats a number as Indian Rupee string without currency symbol, e.g., 1,240 */
export function inr(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  return n.toLocaleString("en-IN");
}

/** Formats a timestamp as DD MMM, HH:MM in Indian format */
export function fmtDate(t) {
  const d = new Date(t);
  return (
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    ", " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}
