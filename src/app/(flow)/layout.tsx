import { Frame } from "@/components/shell/Frame";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

/** Focused task flows — recharge, bill pay, payment, receipt.
 *  Protected: requires an active session. No header or bottom nav. */
export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Frame>
        <main className="flex-1">{children}</main>
      </Frame>
    </AuthGuard>
  );
}
