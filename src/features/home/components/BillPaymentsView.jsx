"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { fetchDashboardData } from "@/features/dashboard/api";
import { ServiceIcon } from "../ServiceIcon";
import { allBillPaymentGroups as fallbackGroups } from "../services";

export function BillPaymentsView({ onClose }) {
  const { t } = useTranslation("home");
  const [bbpsGroups, setBbpsGroups] = useState([]);
  const [baseImgPath, setBaseImgPath] = useState("https://staging.paybyapis.com/images/icons");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDynamicMenus() {
      try {
        let raw = typeof window !== "undefined" ? sessionStorage.getItem("dashboard_data_session") : null;
        let parsed = raw ? JSON.parse(raw) : null;
        
        if (!parsed) {
          parsed = await fetchDashboardData();
        }

        const dynamicMenus = parsed?.dynamic_menus || parsed?.data?.dynamic_menus || parsed || {};
        const imgPath = dynamicMenus?.img_path || parsed?.img_path || "https://staging.paybyapis.com/images/icons";
        const groups = dynamicMenus?.bbps_menus || parsed?.bbps_menus || [];

        setBaseImgPath(imgPath);
        if (Array.isArray(groups) && groups.length > 0) {
          setBbpsGroups(groups);
        } else {
          setBbpsGroups(fallbackGroups);
        }
      } catch (err) {
        console.error("Error loading dynamic bbps_menus from dashboard_data_session:", err);
        setBbpsGroups(fallbackGroups);
      } finally {
        setLoading(false);
      }
    }

    loadDynamicMenus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f4f5fa] max-w-app mx-auto shadow-2xl overflow-hidden">
      {/* 1. BLUE HEADER BAR */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#0112FE] px-4 py-3.5 text-white shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back"
            className="flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-display text-[17px] font-bold">{t("groups.Bill Payments", "Bill Payments")}</h1>
        </div>
        <img src="/bharat-connect-reverse-logo.png" alt="Bharat Connect" className="h-[2.55rem] object-contain" />
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto p-3.5 pb-12 pt-8 flex flex-col gap-4 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-3">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-[12.5px] font-medium">Loading Bill Services...</span>
          </div>
        ) : (
          bbpsGroups.map((group, gIdx) => {
            const rawTitle = group.title || group.name || "Services";
            const groupTitle = t(`groups.${rawTitle}`, rawTitle);
            const subMenus = group.sub_menus || group.items || [];

            return (
              <div key={gIdx} className="relative rounded-2xl border border-border/70 bg-surface p-4 pt-5 shadow-xs">
                {/* Group Title Pill Header */}
                <div className="absolute -top-3.5 left-4 rounded-xl border border-border/80 bg-surface px-3 py-1 text-[12.5px] font-extrabold text-text-1 shadow-2xs">
                  {groupTitle}
                </div>

                {/* 4-Column Grid */}
                <div className="grid grid-cols-4 gap-x-2 gap-y-5 pt-2">
                  {subMenus.map((item, idx) => {
                    let redirectObj = null;
                    if (item.redirect) {
                      try {
                        redirectObj = typeof item.redirect === "string" ? JSON.parse(item.redirect) : item.redirect;
                      } catch {}
                    }
                    const addData = redirectObj?.additional_data || {};
                    const typeVal = addData.type || item.type?.replace(/['.]/g, "") || item.name;

                    const href = item.href 
                      ? item.href 
                      : String(typeVal).toLowerCase() === "prepaid" 
                        ? "/recharge" 
                        : `/billers?type=${encodeURIComponent(typeVal)}`;

                    const iconFileName = item.icon || "";
                    const iconUrl = iconFileName
                      ? (iconFileName.startsWith("http") ? iconFileName : `${baseImgPath}/${iconFileName}`)
                      : null;

                    const rawItemLabel = item.name || item.label || "";
                    const itemKey = item.key || rawItemLabel.toLowerCase().replace(/\s+/g, "");
                    const itemLabel = t(`items.${itemKey}`, rawItemLabel);

                    const inner = (
                      <div className="relative flex flex-col items-center gap-1.5 active:scale-95 transition">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200/70 bg-blue-50/50 shadow-2xs overflow-hidden">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={itemLabel}
                              className="h-7 w-7 object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <span style={{ display: iconUrl ? "none" : "flex" }}>
                            <ServiceIcon name={item.key || (item.name ? item.name.toLowerCase().replace(/\s+/g, "") : "mobile")} color="#0112FE" />
                          </span>
                        </span>
                        <span className="text-center text-[11px] font-medium leading-tight text-text-1 min-h-[26px] flex items-center justify-center">
                          {itemLabel}
                        </span>
                      </div>
                    );

                    return (
                      <Link key={idx} href={href} onClick={onClose} className="block">
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
