/** The fixed-width centered column (locked layout). Both route groups use it;
 *  only the tabbed group adds Header + BottomNav on top. */
export function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col bg-page shadow-xl">
      {children}
    </div>
  );
}
