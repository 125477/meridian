import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN.js";
import enUS from "./locales/en-US.js";

export const supportedLocales = ["zh-CN", "en-US"] as const;
export type AppLocale = (typeof supportedLocales)[number];
export const defaultLocale: AppLocale = "zh-CN";

void i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    "en-US": { translation: enUS },
  },
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
});

export { i18n };
