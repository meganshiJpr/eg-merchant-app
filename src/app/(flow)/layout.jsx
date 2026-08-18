import { Frame } from "@/components/shell/Frame";
import { AuthGuard } from "@/features/auth/components/AuthGuard";

export default function FlowLayout({ children }) {
  return (
    <AuthGuard>
      <Frame>
        <main className="flex-1">{children}</main>
      </Frame>
    </AuthGuard>
  );
}
