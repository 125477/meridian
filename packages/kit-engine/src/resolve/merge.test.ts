import { describe, expect, it } from "vitest";
import { mergeAnswers } from "./merge.js";
import { CreateAnswersSchema } from "@meridian/schema";

const base = CreateAnswersSchema.parse({
  ui: "react",
  platform: "h5",
  withDocs: false,
  withI18n: false,
  withThemes: true,
});

describe("mergeAnswers", () => {
  it("false wins for docs/i18n/themes", () => {
    const merged = mergeAnswers({
      matrix: base,
      llm: { withDocs: true, withI18n: true, withThemes: false, ui: "vue" },
    });
    expect(merged.withDocs).toBe(false);
    expect(merged.withI18n).toBe(false);
    expect(merged.withThemes).toBe(false);
    expect(merged.ui).toBe("vue");
  });

  it("user platform overrides both", () => {
    const merged = mergeAnswers({
      matrix: base,
      llm: { platform: "pc-web" },
      userPlatform: "pc-desktop",
    });
    expect(merged.platform).toBe("pc-desktop");
  });
});
