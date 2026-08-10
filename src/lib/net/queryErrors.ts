import { useToast } from "@/components/ui/Toast";

/**
 * ── The one place backend errors are handled for EVERY API. ──
 *
 * Wired into the QueryClient in providers.tsx, so any query/mutation that
 * rejects (success:0, HTTP error, network) shows its message on screen — with
 * NO per-hook or per-screen code. Add a new API and this covers it for free.
 *
 * Shape-based (not `instanceof ApiError`) because dev bundling can duplicate a
 * module and break instanceof across bundles.
 */

type ErrLike = { code?: string; status?: number; message?: string };

function asErr(error: unknown): ErrLike {
  return error && typeof error === "object" ? (error as ErrLike) : {};
}

/** Definitive backend error (has status/code) → don't retry. Else retry once. */
export function retryPolicy(failureCount: number, error: unknown): boolean {
  const e = asErr(error);
  if (typeof e.status === "number" || typeof e.code === "string") return false;
  return failureCount < 1;
}

/** Show the backend message on screen. EXPIRED is skipped (it redirects). */
export function showQueryError(error: unknown) {
  const e = asErr(error);
  if (e.code === "SESSION_EXPIRED") return;
  useToast.getState().show((e.message && String(e.message)) || "Something went wrong. Please try again.");
}
