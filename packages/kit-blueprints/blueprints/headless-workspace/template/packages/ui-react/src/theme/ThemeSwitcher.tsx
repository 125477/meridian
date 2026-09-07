import { colorThemes } from "./presets.js";
import { useTheme } from "./ThemeProvider.js";

export function ThemeSwitcher() {
  const { theme, setThemeId } = useTheme();
  return (
    <span style={{ display: "inline-flex", gap: 8 }}>
      {colorThemes.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={`Theme ${item.label}`}
          aria-pressed={theme.id === item.id}
          onClick={() => setThemeId(item.id)}
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            border: theme.id === item.id ? "2px solid var(--ink)" : "1px solid var(--line)",
            background: item.primary,
            cursor: "pointer",
          }}
        />
      ))}
    </span>
  );
}
