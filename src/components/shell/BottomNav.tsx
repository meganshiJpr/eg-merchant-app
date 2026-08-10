"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", d: "M12 3 2.5 11h2.6v9.5h5.4v-6h3v6h5.4V11h2.6Z" },
  { href: "/reports", label: "Reports", d: "M3 12h4.5v9H3Zm6.75-5h4.5v14h-4.5Zm6.75-4H21v18h-4.5Z" },
  null, // FAB slot
  { href: "/khaata", label: "Khaata", d: "M5 3h9a3.5 3.5 0 0 1 3.5 3.5V21H8.5A3.5 3.5 0 0 1 5 17.5Zm3 5h6v1.8H8Zm0 4h6v1.8H8Z" },
  { href: "/profile", label: "Profile", d: "M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2.2c-3.6 0-8 1.8-8 5.3V21h16v-1.5c0-3.5-4.4-5.3-8-5.3Z" },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-app items-end justify-around border-t border-border bg-surface px-2 pb-2 pt-1.5">
      {items.map((item, i) =>
        item ? (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
              path === item.href ? "text-primary" : "text-text-3"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
              <path d={item.d} />
            </svg>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        ) : (
          <Link key="scan" href="/scan" className="-mt-6 flex flex-col items-center gap-0.5">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
                <path d="M3 3h8v8H3Zm2 2v4h4V5Zm8-2h8v8h-8Zm2 2v4h4V5ZM3 13h8v8H3Zm2 2v4h4v-4Zm10-2h2.5v2.5H15Zm5.5 0H23v2.5h-2.5ZM15 18.5h2.5V21H15Zm5.5 0H23V21h-2.5Z" />
              </svg>
            </span>
            <span className="text-[10px] font-semibold text-text-3">Scan &amp; Pay</span>
          </Link>
        ),
      )}
    </nav>
  );
}
