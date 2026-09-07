import { defineComponent, h } from "vue";
import { colorThemes, useTheme } from "./store.js";

export const ThemeSwitcher = defineComponent({
  name: "ThemeSwitcher",
  setup() {
    const { themeId, setThemeId } = useTheme();
    return () =>
      h(
        "span",
        { style: { display: "inline-flex", gap: "8px" } },
        colorThemes.map((item) =>
          h("button", {
            type: "button",
            "aria-label": `Theme ${item.label}`,
            onClick: () => setThemeId(item.id),
            style: {
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              background: item.primary,
              border: themeId.value === item.id ? "2px solid var(--ink)" : "1px solid var(--line)",
            },
          }),
        ),
      );
  },
});
