import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import commonEn from "@/locales/en/common.json";
import profileEn from "@/locales/en/profile.json";
import rechargeEn from "@/locales/en/recharge.json";
import walletEn from "@/locales/en/wallet.json";
import reportsEn from "@/locales/en/reports.json";
import errorsEn from "@/locales/en/errors.json";
import homeEn from "@/locales/en/home.json";

import commonHi from "@/locales/hi/common.json";
import profileHi from "@/locales/hi/profile.json";
import rechargeHi from "@/locales/hi/recharge.json";
import walletHi from "@/locales/hi/wallet.json";
import reportsHi from "@/locales/hi/reports.json";
import errorsHi from "@/locales/hi/errors.json";
import homeHi from "@/locales/hi/home.json";

import commonTe from "@/locales/te/common.json";
import profileTe from "@/locales/te/profile.json";
import rechargeTe from "@/locales/te/recharge.json";
import walletTe from "@/locales/te/wallet.json";
import reportsTe from "@/locales/te/reports.json";
import errorsTe from "@/locales/te/errors.json";
import homeTe from "@/locales/te/home.json";

import commonTa from "@/locales/ta/common.json";
import profileTa from "@/locales/ta/profile.json";
import rechargeTa from "@/locales/ta/recharge.json";
import walletTa from "@/locales/ta/wallet.json";
import reportsTa from "@/locales/ta/reports.json";
import errorsTa from "@/locales/ta/errors.json";
import homeTa from "@/locales/ta/home.json";

import commonMl from "@/locales/ml/common.json";
import profileMl from "@/locales/ml/profile.json";
import rechargeMl from "@/locales/ml/recharge.json";
import walletMl from "@/locales/ml/wallet.json";
import reportsMl from "@/locales/ml/reports.json";
import errorsMl from "@/locales/ml/errors.json";
import homeMl from "@/locales/ml/home.json";

import commonKn from "@/locales/kn/common.json";
import profileKn from "@/locales/kn/profile.json";
import rechargeKn from "@/locales/kn/recharge.json";
import walletKn from "@/locales/kn/wallet.json";
import reportsKn from "@/locales/kn/reports.json";
import errorsKn from "@/locales/kn/errors.json";
import homeKn from "@/locales/kn/home.json";

import commonBn from "@/locales/bn/common.json";
import profileBn from "@/locales/bn/profile.json";
import rechargeBn from "@/locales/bn/recharge.json";
import walletBn from "@/locales/bn/wallet.json";
import reportsBn from "@/locales/bn/reports.json";
import errorsBn from "@/locales/bn/errors.json";
import homeBn from "@/locales/bn/home.json";

const savedLang = typeof window !== "undefined" ? localStorage.getItem("user_lang") || "en" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { common: commonEn, profile: profileEn, recharge: rechargeEn, wallet: walletEn, reports: reportsEn, errors: errorsEn, home: homeEn },
    hi: { common: commonHi, profile: profileHi, recharge: rechargeHi, wallet: walletHi, reports: reportsHi, errors: errorsHi, home: homeHi },
    te: { common: commonTe, profile: profileTe, recharge: rechargeTe, wallet: walletTe, reports: reportsTe, errors: errorsTe, home: homeTe },
    ta: { common: commonTa, profile: profileTa, recharge: rechargeTa, wallet: walletTa, reports: reportsTa, errors: errorsTa, home: homeTa },
    ml: { common: commonMl, profile: profileMl, recharge: rechargeMl, wallet: walletMl, reports: reportsMl, errors: errorsMl, home: homeMl },
    kn: { common: commonKn, profile: profileKn, recharge: rechargeKn, wallet: walletKn, reports: reportsKn, errors: errorsKn, home: homeKn },
    bn: { common: commonBn, profile: profileBn, recharge: rechargeBn, wallet: walletBn, reports: reportsBn, errors: errorsBn, home: homeBn },
  },
  lng: savedLang,
  fallbackLng: "en",
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
