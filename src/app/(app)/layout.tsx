import { AppShell } from "@/components/shell/AppShell";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

/** Main tabbed area — Home, Reports, Khaata, Profile, etc.
 *  Protected: requires an active session. Shows header + bottom nav. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
