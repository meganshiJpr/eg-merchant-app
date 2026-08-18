"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { useTheme } from "@/lib/store/theme";
import { useToast } from "@/components/ui/Toast";
import { Sheet } from "@/components/ui/Sheet";
import { MenuGroup, MenuRow } from "@/features/profile/components/MenuRow";
import { ICONS } from "@/features/profile/icons";
import { ChangePinSheet } from "@/features/profile/components/ChangePinSheet";

const LANGS = ["English", "हिन्दी (Hindi)", "मराठी (Marathi)", "ગુજરાતી (Gujarati)"];

function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const merchant = useAuthStore((s) => s.merchant);
  const clear = useAuthStore((s) => s.clear);
  const theme = useTheme();
  const toast = useToast((t) => t.show);

  const [langOpen, setLangOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [lang, setLang] = useState("English");
  const [logoutOpen, setLogoutOpen] = useState(false);

  const name = merchant?.name ?? "Ramesh Kumar";
  const shop = merchant?.shopName ?? "Shri Balaji Mobile Store";
  const kyc = merchant?.kycStatus ?? "review";
  const kycLabel = kyc === "verified" ? "KYC Verified" : kyc === "review" ? "KYC Under Review" : "KYC Pending";
  const kycTone = kyc === "verified" ? "bg-teal-soft text-teal" : kyc === "review" ? "bg-teal-soft text-teal" : "bg-orange-soft text-orange";

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-violet px-4 pb-5 pt-5 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 font-display text-[22px] font-bold">
              {initials(name)}
            </div>
            <button
              onClick={() => toast("Opens photo picker")}
              className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
                <path d="M3 17.2V21h3.8L17.9 9.9l-3.8-3.8ZM20.7 7.1a1 1 0 0 0 0-1.4L18.3 3.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8Z" />
              </svg>
            </button>
          </div>
          <div className="min-w-0">
            <div className="font-display text-[17px] font-bold">{name}</div>
            <div className="truncate text-[12px] opacity-90">{shop}</div>
            <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${kycTone}`}>
              {kycLabel}
            </span>
          </div>
        </div>
        <div className="mono mt-3 text-[11px] opacity-80">Merchant ID · EGM48291057</div>
      </div>

      <MenuGroup label="Account">
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.user }} />} iconBg="var(--primary-soft)" iconColor="var(--primary)" title="Personal details" sub="Name, mobile, email" onClick={() => router.push("/profile/personal")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.shop }} />} iconBg="var(--accent-soft)" iconColor="var(--accent)" title="Shop details" sub="Shop name, address, GST" onClick={() => router.push("/profile/shop")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.bank }} />} iconBg="var(--teal-soft)" iconColor="var(--teal)" title="Bank accounts" sub="Settlement account" onClick={() => router.push("/profile/banks")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.doc }} />} iconBg="var(--violet-soft)" iconColor="var(--violet)" title="KYC documents" sub={kycLabel} onClick={() => router.push("/profile/kyc-docs")} />
      </MenuGroup>

      <MenuGroup label="Settings">
        <MenuRow
          icon={<g dangerouslySetInnerHTML={{ __html: ICONS.moon }} />} iconBg="var(--primary-soft)" iconColor="var(--primary)"
          title="Dark mode"
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
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.globe }} />} iconBg="var(--teal-soft)" iconColor="var(--teal)" title="Language" sub={lang} onClick={() => setLangOpen(true)} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.pin }} />} iconBg="var(--orange-soft)" iconColor="var(--orange)" title="Change MPIN" sub="4-digit transaction PIN" onClick={() => setPinOpen(true)} />
      </MenuGroup>

      <MenuGroup label="Support">
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.help }} />} iconBg="var(--violet-soft)" iconColor="var(--violet)" title="Help & Support" sub="FAQs, call, WhatsApp" onClick={() => router.push("/support")} />
        <MenuRow icon={<g dangerouslySetInnerHTML={{ __html: ICONS.logout }} />} iconBg="var(--accent-soft)" iconColor="var(--accent)" title="Log out" danger onClick={() => setLogoutOpen(true)} right={<span />} />
      </MenuGroup>

      <div className="pb-2 text-center text-[11px] text-text-3">EG Merchant · v0.1.0</div>

      {/* Language sheet */}
      <Sheet open={langOpen} onClose={() => setLangOpen(false)}>
        <div className="mb-3 font-display text-[15px] font-semibold">Choose language</div>
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => { setLang(l); setLangOpen(false); toast(`Language set to ${l}`); }}
            className={`mb-2 flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-[13px] font-semibold ${lang === l ? "border-primary bg-primary-soft text-primary" : "border-border bg-page"}`}
          >
            {l}
            {lang === l && (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-primary"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4Z" /></svg>
            )}
          </button>
        ))}
      </Sheet>

      <ChangePinSheet open={pinOpen} onClose={() => setPinOpen(false)} />

      {/* Logout confirm */}
      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)}>
        <div className="font-display text-[15px] font-semibold">Log out?</div>
        <p className="mt-2 text-[12.5px] text-text-2">You will need your mobile number and OTP to log back in.</p>
        <div className="mt-4 flex gap-2.5">
          <button onClick={() => setLogoutOpen(false)} className="flex-1 rounded-xl border-[1.5px] border-border bg-surface py-3 font-display text-[13px] font-semibold">Cancel</button>
          <button onClick={() => { clear(); router.push("/"); toast("Logged out"); }} className="flex-1 rounded-xl bg-accent py-3 font-display text-[13px] font-semibold text-white">Log out</button>
        </div>
      </Sheet>
    </div>
  );
}
