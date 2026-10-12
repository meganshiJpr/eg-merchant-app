"use client";

import { Sheet } from "@/components/ui/Sheet";
import { useLanguageStore } from "@/lib/store/languageStore";
import { useTranslation } from "react-i18next";
import { postAppLanguage } from "@/features/dashboard/api";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "bn", label: "Bengali", native: "বাংলা" }, 
];

export function LanguageSelectionSheet({ open, onClose }) {
  const { t } = useTranslation("profile");
  const { language, setLanguage } = useLanguageStore();

  const handleSelect = async (code) => {
    try {
      await postAppLanguage({ language: code });
    } catch (err) {
      console.warn("postAppLanguage failed:", err);
    }
    setLanguage(code);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="mb-4 font-display text-[16px] font-bold text-text-1">
        {t("languageSheet.title", "Select App Language")}
      </div>
      <div className="flex flex-col gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelect(lang.code)}
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition ${
              language === lang.code
                ? "border-primary bg-primary/5 font-semibold text-primary"
                : "border-border bg-surface text-text-1 hover:bg-page"
            }`}
          >
            <div>
              <div className="text-[14px] font-bold">{lang.native}</div>
              <div className="text-[11px] text-text-3">{lang.label}</div>
            </div>
            {language === lang.code && (
              <span className="text-[14px] font-bold text-primary">✓</span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
