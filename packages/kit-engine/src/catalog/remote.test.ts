import { describe, expect, it } from "vitest";
import { loadRemoteCatalog } from "./remote.js";

describe("loadRemoteCatalog", () => {
  it("accepts blueprints or presets keys", async () => {
    const catalog = await loadRemoteCatalog("https://example.test/catalog.json", async () =>
      new Response(JSON.stringify({ version: 1, presets: [{ id: "custom", source: "file:/tmp/x" }] }), {
        status: 200,
      }),
    );
    expect(catalog.blueprints[0]?.id).toBe("custom");
  });

  it("rejects invalid payload", async () => {
    await expect(
      loadRemoteCatalog("https://example.test/bad.json", async () =>
        new Response(JSON.stringify({ nope: true }), { status: 200 }),
      ),
    ).rejects.toThrow(/格式无效/);
  });
});
