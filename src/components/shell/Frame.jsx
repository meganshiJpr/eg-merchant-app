export function Frame({ children }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-app flex-col bg-page shadow-xl">
      {children}
    </div>
  );
}
