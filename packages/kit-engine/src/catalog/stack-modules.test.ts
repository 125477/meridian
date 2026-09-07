import { describe, expect, it } from "vitest";
import { matchModulesFromDescription, filterModulesForUi, collectModuleDependencies } from "./stack-modules.js";

describe("stack-modules", () => {
  it("matches markdown and rich-text from description", () => {
    const ids = matchModulesFromDescription("需要 markdown 渲染和 lexical 富文本");
    expect(ids).toContain("markdown");
    expect(ids).toContain("rich-text");
  });

  it("keeps rich-text for vue with tiptap deps", () => {
    const filtered = filterModulesForUi(["rich-text", "markdown", "pinyin"], "vue");
    expect(filtered).toEqual(["rich-text", "markdown", "pinyin"]);
    const deps = collectModuleDependencies(["rich-text"], "vue");
    expect(deps["@tiptap/vue-3"]).toMatch(/^\^/);
    expect(deps.lexical).toBeUndefined();
  });

  it("collects marked dependency", () => {
    const deps = collectModuleDependencies(["markdown"], "react");
    expect(deps.marked).toMatch(/^\^/);
  });
});
