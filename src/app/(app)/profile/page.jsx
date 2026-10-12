"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/lib/auth/store";
import { useTheme } from "@/lib/store/theme";
import { useLanguageStore } from "@/lib/store/languageStore";
import { useToast } from "@/components/ui/Toast";
import { Sheet } from "@/components/ui/Sheet";
import { MenuGroup, MenuRow } from "@/features/profile/components/MenuRow";
import { ICONS } from "@/features/profile/icons";
import { ChangePinSheet } from "@/features/profile/components/ChangePinSheet";
import { ResetPinOtpSheet } from "@/features/profile/components/ResetPinOtpSheet";
import { LanguageSelectionSheet } from "@/features/profile/components/LanguageSelectionSheet";

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation(["profile", "common"]);
  const merchant = useAuthStore((s) => s.merchant);
  const clear = useAuthStore((s) => s.clear);
  const theme = useTheme();
  const toast = useToast((t) => t.show);
  const language = useLanguageStore((s) => s.language);

  const [langOpen, setLangOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [resetOtpOpen, setResetOtpOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const name = merchant?.name || "Ramesh Kumar";
  const shop = merchant?.shopName || "Shri Balaji Mobile Store";
  const isKycDone = merchant?.isKycCompleted === true || merchant?.kycStatus === "verified";
  const kycLabel = isKycDone ? "KYC Verified" : "KYC Pending";
  const kycTone = isKycDone ? "bg-teal-soft text-teal" : "bg-orange-soft text-orange";
  const LANG_DISPLAY_NAMES = {
    en: "English",
    hi: "हिंदी (Hindi)",
    te: "తెలుగు (Telugu)",
    ta: "தமிழ் (Tamil)",
    ml: "മലയാളം (Malayalam)",
    kn: "ಕನ್ನಡ (Kannada)",
    bn: "বাংলা (Bengali)",
  };
  const currentLangLabel = LANG_DISPLAY_NAMES[language] || "English";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-violet px-4 pb-5 pt-5 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 font-display text-[22px] font-bold">
              {initials(name)} 
              
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold">{name}</div>
            <div className="truncate text-[12px] opacity-90">{shop}</div>
            <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${kycTone}`}>
              {kycLabel} 
            </span>
          </div>
        </div>
        <div className="mono mt-3 text-[11px] opacity-80">{t("profile:merchantId")} · EGM48291057</div>
      </div>

      <MenuGroup label={t("profile:sections.account")}>
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.user }} />} iconBg="var(--primary-soft)" iconColor="var(--primary)" title={t("profile:menu.personalDetails")} sub={t("profile:menu.personalDetailsSub")} onClick={() => router.push("/profile/personal")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.shop }} />} iconBg="var(--accent-soft)" iconColor="var(--accent)" title={t("profile:menu.shopDetails")} sub={t("profile:menu.shopDetailsSub")} onClick={() => router.push("/profile/shop")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.bank }} />} iconBg="var(--teal-soft)" iconColor="var(--teal)" title={t("profile:banks.title")} sub={t("profile:banks.subtitle")} onClick={() => router.push("/profile/banks")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.doc }} />} iconBg="var(--violet-soft)" iconColor="var(--violet)" title={t("profile:menu.kycDocs")} sub={kycLabel} onClick={() => router.push("/profile/kyc-docs")} />
      </MenuGroup>

      <MenuGroup label={t("profile:sections.appSettings", "Settings")}>
        <MenuRow
          icon={<g dangerouslySetInnerHTML={{ __html: ICONS.moon }} />} iconBg="var(--primary-soft)" iconColor="var(--primary)"
          title={t("profile:menu.DarkMode", "Dark Mode")}
          right={
            <span
              onClick={(e) => { e.stopPropagation(); theme.toggle(); }}
              className={`relative h-6 w-11 flex-none rounded-full transition ${theme.dark ? "bg-primary" : "bg-border"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${theme.dark ? "left-[22px]" : "left-0.5"}`} />
            </span>
          }
          onClick={() => theme.toggle()}
        />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.globe }} />} iconBg="var(--teal-soft)" iconColor="var(--teal)" title={t("profile:menu.appLanguage")} sub={currentLangLabel} onClick={() => setLangOpen(true)} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.pin }} />} iconBg="var(--orange-soft)" iconColor="var(--orange)" title={t("profile:menu.changeMpin")} sub={t("profile:menu.changeMpinSub")} onClick={() => setPinOpen(true)} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.keyboard }} />} iconBg="var(--violet-soft)" iconColor="var(--violet)" title={t("profile:menu.resetMpinOtp")} sub={t("profile:menu.resetMpinOtpSub")} onClick={() => setResetOtpOpen(true)} />
      </MenuGroup>

      <MenuGroup label={t("profile:sections.support")}>
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.help }} />} iconBg="var(--violet-soft)" iconColor="var(--violet)" title={t("profile:menu.Help & Support")} sub={t("profile:menu.HelpSupportSub")} onClick={() => router.push("/profile/support")} />
        <MenuRow iconImage="/B-mnemonic-reverse.png" iconBg="var(--primary)" title={t("profile:menu.complaints")} sub={t("profile:menu.complaintsSub")} onClick={() => router.push("/profile/complaint-registration")} />
        <MenuRow iconImage="/B-mnemonic-reverse.png" iconBg="var(--primary)" title={t("profile:menu.transactionHistory")} sub={t("profile:menu.transactionHistorySub")} onClick={() => router.push("/profile/transaction-history")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.logout }} />} iconBg="var(--accent-soft)" iconColor="var(--accent)" title={t("profile:logoutModal.confirm")} danger onClick={() => setLogoutOpen(true)} right={<span />} />
      </MenuGroup>

      <div className="pb-2 text-center text-[11px] text-text-3">EG Merchant · v0.1.0</div>

      {/* Language sheet */}
      <LanguageSelectionSheet open={langOpen} onClose={() => setLangOpen(false)} />

      <ChangePinSheet open={pinOpen} onClose={() => setPinOpen(false)} />
      <ResetPinOtpSheet open={resetOtpOpen} onClose={() => setResetOtpOpen(false)} mobile={merchant?.mobile || merchant?.phone || ""} />

      {/* Logout confirm */}
      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <div className="font-display text-[15px] font-semibold">{t("profile:logoutModal.title")}</div>
        <p className="mt-2 text-[12.5px] text-text-2">{t("profile:logoutModal.description")}</p>
        <div className="mt-4 flex gap-2.5">
          <button onClick={() => setLogoutOpen(false)} className="flex-1 rounded-xl border-[1.5px] border-border bg-surface py-3 font-display text-[13px] font-semibold">{t("common:cancel")}</button>
          <button onClick={() => { clear(); router.push("/"); toast(t("profile:logoutModal.loggedOut")); }} className="flex-1 rounded-xl bg-accent py-3 font-display text-[13px] font-semibold text-white">{t("profile:logoutModal.confirm")}</button>
        </div>
      </Sheet>
    </div>
  );
}
