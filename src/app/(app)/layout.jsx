import { AppShell } from "@/components/shell/AppShell";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

export default function AppLayout({ children }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
