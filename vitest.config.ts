import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "packages/*/src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@meridian/schema": fileURLToPath(new URL("./packages/kit-schema/src/index.ts", import.meta.url)),
      "@meridian/blueprints": fileURLToPath(new URL("./packages/kit-blueprints/src/index.ts", import.meta.url)),
      "@meridian/engine": fileURLToPath(new URL("./packages/kit-engine/src/index.ts", import.meta.url)),
    },
  },
});
