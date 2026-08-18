import { useToast } from "@/components/ui/Toast";

function asErr(error) {
  return error && typeof error === "object" ? error : {};
}

/** Definitive backend error (has status/code) → don't retry. Else retry once. */
export function retryPolicy(failureCount, error) {
  const e = asErr(error);
  if (typeof e.status === "number" || typeof e.code === "string") return false;
  return failureCount < 1;
}

/** Show the backend message on screen. EXPIRED is skipped (it redirects). */
export function showQueryError(error) {
  const e = asErr(error);
  if (e.code === "SESSION_EXPIRED") return;
  useToast.getState().show((e.message && String(e.message)) || "Something went wrong. Please try again.");
}
