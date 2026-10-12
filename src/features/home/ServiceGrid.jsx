"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { serviceGroups } from "./services";
import { useToast } from "@/components/ui/Toast";
import { ServiceIcon } from "./ServiceIcon";
import { fetchOperatorsList } from "@/features/dashboard/api";
import { BillPaymentsView } from "./components/BillPaymentsView";

function Tile({ s }) {
  const { t } = useTranslation("home");
  const toast = useToast((t) => t.show);
  const labelText = t(`items.${s.key}`, s.label);

  const inner = (
    <>
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: s.soft }}
      >
        <ServiceIcon name={s.key} color={s.color} />
      </span>
      <span className="text-center text-[11px] font-medium leading-tight text-text-2">
        {labelText}
      </span>
    </>
  );
  const cls = "flex flex-col items-center gap-1.5 py-1 active:scale-[0.96] transition";

  return s.href ? (
    <Link href={s.href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button className={cls} onClick={() => toast(`${labelText} — coming in a later milestone`)}>
      {inner}
    </button>
  );
}

export function ServiceGrid() {
  const { t } = useTranslation("home");
  const [showAllBills, setShowAllBills] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function getOperatorsList() {
      try {
        const data = await fetchOperatorsList();  
      } catch (error) {
        console.error("Error fetching operators list:", error);
      }
    }

    getOperatorsList();
  },[]);
  
  return (
    <div className="flex flex-col gap-4">
      {serviceGroups.map((g) => (
        <section key={g.title} className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-1 px-1">
            {g.logo === true && (
              <img src="/B-mnemonic.jpg" alt="Bharat Connect" className="h-6"/>
            )}
            <h2 className="font-display text-[13px] font-semibold">{t(`groups.${g.title}`, g.title)}</h2>
            {g.viewAll === true && (
              <button
                type="button"
                onClick={() => setShowAllBills(true)}
                className="ml-auto h-6 text-[11px] w-auto text-primary font-semibold hover:underline"
              >
                {t("viewAll", "View All")}
              </button>
            )}
          </div>
          <div className="grid grid-cols-4 gap-x-1 gap-y-3">
            {g.items.map((s) => (
              <Tile key={s.key} s={s} />
            ))}
          </div>
        </section>
      ))}

      {showAllBills && <BillPaymentsView onClose={() => setShowAllBills(false)} />}
    </div>
  );
}
