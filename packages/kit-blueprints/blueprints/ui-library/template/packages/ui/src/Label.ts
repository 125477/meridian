import { defineComponent, h } from "vue";

export const Label = defineComponent({
  name: "Label",
  setup(_props, { slots }) {
    return () => h("span", slots.default?.());
  },
});
