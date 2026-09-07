import { defineComponent, h } from "vue";
import { useI18n } from "vue-i18n";

const locales = ["zh-CN", "en-US"] as const;

export const LocaleSwitcher = defineComponent({
  name: "LocaleSwitcher",
  setup() {
    const { locale } = useI18n();
    return () =>
      h(
        "span",
        { style: { display: "inline-flex", gap: "8px" } },
        locales.map((item) =>
          h(
            "button",
            {
              type: "button",
              onClick: () => {
                locale.value = item;
              },
            },
            item,
          ),
        ),
      );
  },
});
