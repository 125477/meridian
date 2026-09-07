import { defineComponent, h, type PropType, type VNode } from "vue";

export const AppShell = defineComponent({
  name: "AppShell",
  props: {
    title: { type: String, required: true },
    sidebar: { type: Object as PropType<VNode | null>, default: null },
    actions: { type: Object as PropType<VNode | null>, default: null },
  },
  setup(props, { slots }) {
    return () =>
      h(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: props.sidebar ? "240px 1fr" : "1fr",
            minHeight: "100vh",
          },
        },
        [
          props.sidebar
            ? h(
                "aside",
                {
                  style: {
                    padding: "24px 20px",
                    borderRight: "1px solid var(--line)",
                    background: "var(--bg-elevated)",
                  },
                },
                [props.sidebar],
              )
            : null,
          h("div", { style: { display: "flex", flexDirection: "column", minWidth: 0 } }, [
            h(
              "header",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 28px",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--bg-elevated)",
                },
              },
              [h("strong", props.title), h("div", props.actions)],
            ),
            h("main", { style: { padding: "28px", flex: 1 } }, slots.default?.()),
          ]),
        ],
      );
  },
});
