import { createI18n } from "vue-i18n";
import zhCN from "./locales/zh-CN.js";
import enUS from "./locales/en-US.js";

export const i18n = createI18n({
  legacy: false,
  locale: "zh-CN",
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS,
  },
});

export { LocaleSwitcher } from "./locale-switcher.js";
