import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { colorThemes, getThemeById, type ColorTheme } from "./presets.js";

const STORAGE_KEY = "meridian-theme-id";

interface ThemeContextValue {
  theme: ColorTheme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ColorTheme): void {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--bg", theme.background);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof localStorage === "undefined") return colorThemes[0]!.id;
    return localStorage.getItem(STORAGE_KEY) ?? colorThemes[0]!.id;
  });
  const theme = useMemo(() => getThemeById(themeId), [themeId]);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme.id);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme 必须在 ThemeProvider 内使用");
  return value;
}
