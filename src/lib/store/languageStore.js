import { create } from "zustand";
import i18n from "@/lib/i18n";

const getSavedLanguage = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("user_lang") || "en";
  }
  return "en";
};

export const useLanguageStore = create((set) => ({
  language: getSavedLanguage(),
  setLanguage: (lang) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_lang", lang);
    }
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));

