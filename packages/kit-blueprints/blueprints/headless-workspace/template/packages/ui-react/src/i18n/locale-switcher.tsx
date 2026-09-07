import { i18n, supportedLocales, type AppLocale } from "./config.js";

export function LocaleSwitcher() {
  const current = i18n.language as AppLocale;
  return (
    <span style={{ display: "inline-flex", gap: 8 }}>
      {supportedLocales.map((locale) => (
        <button
          key={locale}
          type="button"
          aria-pressed={current === locale}
          onClick={() => void i18n.changeLanguage(locale)}
          style={{
            border: "1px solid var(--line)",
            background: current === locale ? "var(--accent)" : "transparent",
            color: current === locale ? "var(--accent-ink)" : "inherit",
            borderRadius: 8,
            padding: "4px 8px",
            cursor: "pointer",
          }}
        >
          {locale}
        </button>
      ))}
    </span>
  );
}
