import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import { i18n } from "./config.js";

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export { useTranslation } from "react-i18next";
export { LocaleSwitcher } from "./locale-switcher.js";
export { i18n, supportedLocales } from "./config.js";
