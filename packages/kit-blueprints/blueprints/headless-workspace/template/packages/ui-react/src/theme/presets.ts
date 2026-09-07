export interface ColorTheme {
  id: string;
  label: string;
  primary: string;
  accent: string;
  background: string;
}

export const colorThemes: ColorTheme[] = [
  { id: "sand", label: "Sand", primary: "#c45c26", accent: "#c45c26", background: "#f4f1ea" },
  { id: "slate", label: "Slate", primary: "#334155", accent: "#0f766e", background: "#f8fafc" },
  { id: "ink", label: "Ink", primary: "#1d4ed8", accent: "#7c3aed", background: "#eef2ff" },
];

export function getThemeById(id: string): ColorTheme {
  return colorThemes.find((theme) => theme.id === id) ?? colorThemes[0]!;
}
