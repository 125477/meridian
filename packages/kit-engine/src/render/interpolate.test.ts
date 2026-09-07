import { describe, expect, it } from "vitest";
import { interpolate } from "./interpolate.js";

describe("interpolate", () => {
  it("replaces dotted paths", () => {
    const out = interpolate("hello {{projectName}} {{answers.ui}}", {
      projectName: "demo",
      answers: { ui: "react" },
    });
    expect(out).toBe("hello demo react");
  });

  it("handles if/else/unless", () => {
    const ctx = { withDocs: false, withI18n: true };
    expect(interpolate("{{#if withDocs}}A{{else}}B{{/if}}", ctx)).toBe("B");
    expect(interpolate("{{#unless withDocs}}ok{{/unless}}", ctx)).toBe("ok");
    expect(interpolate("{{#if withI18n}}yes{{/if}}", ctx)).toBe("yes");
  });

  it("expands each", () => {
    const out = interpolate("{{#each layers}}[{{this}}]{{/each}}", { layers: ["engine", "ui"] });
    expect(out).toBe("[engine][ui]");
  });

  it("does not evaluate javascript", () => {
    const out = interpolate("{{process.exit}}", { projectName: "x" });
    expect(out).toBe("");
  });
});
