#!/usr/bin/env node
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

process.argv.splice(2, 0, "create");
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("@meridian/kit/package.json"));
await import(pathToFileURL(join(pkgDir, "dist/index.js")).href);
