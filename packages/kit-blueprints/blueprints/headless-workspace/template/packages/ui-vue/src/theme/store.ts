import { ref } from "vue";

export const colorThemes = [
  { id: "sand", label: "Sand", primary: "#c45c26", accent: "#c45c26", background: "#f4f1ea" },
  { id: "slate", label: "Slate", primary: "#334155", accent: "#0f766e", background: "#f8fafc" },
  { id: "ink", label: "Ink", primary: "#1d4ed8", accent: "#7c3aed", background: "#eef2ff" },
] as const;

export type ColorTheme = (typeof colorThemes)[number];

const currentId = ref<string>(colorThemes[0].id);

export function applyTheme(id: string): void {
  const theme = colorThemes.find((item) => item.id === id) ?? colorThemes[0];
  currentId.value = theme.id;
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--bg", theme.background);
}

export function useTheme() {
  return {
    themeId: currentId,
    setThemeId: applyTheme,
    themes: colorThemes,
  };
}
