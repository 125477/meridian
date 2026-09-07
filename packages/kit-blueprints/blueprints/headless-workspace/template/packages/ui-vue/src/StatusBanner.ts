import { defineComponent, h, type PropType } from "vue";

export const StatusBanner = defineComponent({
  name: "StatusBanner",
  props: {
    tone: { type: String as PropType<"neutral" | "danger">, default: "neutral" },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          style: {
            padding: "12px 16px",
            borderRadius: "var(--radius)",
            background: props.tone === "danger" ? "rgba(155,44,44,0.08)" : "var(--bg-elevated)",
            color: props.tone === "danger" ? "var(--danger)" : "var(--muted)",
            boxShadow: "var(--shadow)",
          },
        },
        slots.default?.(),
      );
  },
});
