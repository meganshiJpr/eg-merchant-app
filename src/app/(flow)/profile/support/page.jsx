"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { SubHeader } from "@/components/ui/SubHeader";

export default function SupportPage() {
  const { t } = useTranslation("profile");
  const [supportInfo, setSupportInfo] = useState({
    support_email: "",
    support_message: "",
    support_number: "",
    whatsapp_number: "",
    address: "",
  });
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("dashboard_data_session") : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        const dataObj = parsed?.data || parsed || {};

        setSupportInfo({
          support_email: dataObj.support_email || "",
          support_message: dataObj.support_message || "",
          support_number: dataObj.support_number || "",
          whatsapp_number: dataObj.whatsapp_number || "",
          address: dataObj.address || "",
        });
      }
    } catch (err) {
      console.error("Error reading support info from sessionStorage:", err);
    }
  }, []);

  const cleanPhone = (num) => (num ? String(num).replace(/\D/g, "") : "");

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: t("supportPage.faqs.q1", "Money deducted but transaction failed?"),
      a: t("supportPage.faqs.a1", "If money was debited for a failed transaction, it is typically refunded automatically to your wallet or bank account within 24 to 48 hours. You can also raise a ticket to track the issue status."),
    },
    {
      q: t("supportPage.faqs.q2", "Manual deposit not credited yet?"),
      a: t("supportPage.faqs.a2", "Manual bank deposits are verified and processed within 30 to 60 minutes during operational hours. Please verify that your UTR / Reference ID was entered accurately."),
    },
    {
      q: t("supportPage.faqs.q3", "How to change settlement bank account?"),
      a: t("supportPage.faqs.a3", "Go to Profile > Bank Accounts & UPI. You can add a new bank account or request changes to your primary settlement account."),
    },
    {
      q: t("supportPage.faqs.q4", "Forgot transaction PIN?"),
      a: t("supportPage.faqs.a4", "You can instantly reset your 4-digit MPIN using mobile OTP verification under Profile > Reset M Pin by OTP."),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FC] pb-10">
      <SubHeader title="Help & Support" backHref="/profile" showImg={false} />

      <div className="mx-auto max-w-md space-y-6 px-4 pt-5">
        <div className="grid grid-cols-3 gap-3">
          {/* Card 1: Call us */}
          <a
            href={`tel:${cleanPhone(supportInfo.support_number)}`}
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm transition active:scale-[0.97] hover:border-indigo-200"
          >
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1.003 1.003 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2Z" />
              </svg>
            </div>
            <span className="text-[13px] font-bold text-slate-800">{t("supportPage.callUs", "Call us")}</span>
            <span className="mt-0.5 text-[11px] font-normal text-slate-400">{supportInfo.support_number}</span>
          </a>

          {/* Card 2: WhatsApp */}
          <a
            href={`https://wa.me/91${cleanPhone(supportInfo.whatsapp_number)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm transition active:scale-[0.97] hover:border-emerald-200"
          >
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2Zm5.78 14.15c-.24.68-1.2 1.3-1.66 1.35-.46.05-1.04.22-3.41-.71-2.85-1.12-4.66-4.04-4.8-4.23-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07 1-2.35.26-.28.58-.35.77-.35.19 0 .38.01.55.01.18 0 .42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.3.38-.43.51-.14.14-.29.29-.12.58.17.28.75 1.23 1.61 2 1.11.99 2.05 1.3 2.34 1.44.28.14.45.12.62-.07.17-.19.73-.85.92-1.14.19-.28.38-.24.64-.14.26.09 1.67.79 1.96.93.28.14.47.21.54.33.07.12.07.69-.17 1.37Z" />
              </svg>
            </div>
            <span className="text-[13px] font-bold text-slate-800">{t("supportPage.whatsapp", "WhatsApp")}</span>
            <span className="mt-0.5 text-[11px] font-normal text-slate-400">{supportInfo.whatsapp_number}</span>
          </a>

          {/* Card 3: Raise ticket */}
          <Link
            href="/profile/complaint-registration"
            className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-sm transition active:scale-[0.97] hover:border-pink-200"
          >
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 14H4V8l8 5 8-5v10Zm-8-7L4 6h16l-8 5Z" />
              </svg>
            </div>
            <span className="text-[13px] font-bold text-slate-800">{t("supportPage.raiseTicket", "Raise ticket")}</span>
            <span className="mt-0.5 text-[11px] font-normal text-slate-400">{t("supportPage.trackIssues", "Track issues")}</span>
          </Link>
        </div>

        {supportInfo.support_message && (
          <div className="text-center text-[12.5px] font-medium text-slate-400">
            {t("supportPage.supportHours", "Support hours:")} {supportInfo.support_message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="px-5 pb-2 pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {t("supportPage.commonQuestions", "Common Questions")}
          </div>

          <div className="divide-y divide-slate-100">
            {faqs.map((faq, idx) => (
              <div key={faq.q} className="transition">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-[13.5px] font-semibold text-slate-800 transition hover:bg-slate-50/50"
                >
                  <span>{faq.q}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 flex-none fill-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-indigo-600" : ""
                    }`}
                  >
                    <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="bg-slate-50/40 px-5 pb-4 text-[12.5px] leading-relaxed text-slate-500">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
