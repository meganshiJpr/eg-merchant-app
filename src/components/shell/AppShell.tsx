import { Frame } from "./Frame";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

/** Chrome for the main tabbed screens: home header + bottom nav. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Frame>
      <Header />
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </Frame>
  );
}
