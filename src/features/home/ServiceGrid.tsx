"use client";

import Link from "next/link";
import { serviceGroups, type Service } from "./services";
import { useToast } from "@/components/ui/Toast";
import { ServiceIcon } from "./ServiceIcon";

function Tile({ s }: { s: Service }) {
  const toast = useToast((t) => t.show);
  const inner = (
    <>
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: s.soft }}
      >
        <ServiceIcon name={s.key} color={s.color} />
      </span>
      <span className="text-center text-[11px] font-medium leading-tight text-text-2">
        {s.label}
      </span>
    </>
  );
  const cls = "flex flex-col items-center gap-1.5 py-1 active:scale-[0.96] transition";

  return s.href ? (
    <Link href={s.href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button className={cls} onClick={() => toast(`${s.label} — coming in a later milestone`)}>
      {inner}
    </button>
  );
}

export function ServiceGrid() {
  return (
    <div className="flex flex-col gap-4">
      {serviceGroups.map((g) => (
        <section key={g.title} className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="h-4 w-1 rounded-full" style={{ background: g.barColor }} />
            <h2 className="font-display text-[13px] font-semibold">{g.title}</h2>
            {g.title === "Recharge and Bills" && (
              /* Bharat Connect mark — served from /public per NPCI brand rules */
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/bharat-connect.png" alt="Bharat Connect" className="ml-auto h-5 w-auto" />
            )}
          </div>
          <div className="grid grid-cols-4 gap-x-1 gap-y-3">
            {g.items.map((s) => (
              <Tile key={s.key} s={s} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
