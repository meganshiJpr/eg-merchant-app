import { Frame } from "./Frame";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }) {
  return (
    <Frame>
      <Header />
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </Frame>
  );
}
