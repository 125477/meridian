#!/usr/bin/env node
import { resolve } from "node:path";
import { loadEngine, parseArgs } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const engine = await loadEngine();
const result = await engine.addToProject({
  projectDir: resolve(String(flags.path ?? ".")),
  feature: positional[0],
  modules: flags.modules ? String(flags.modules).split(",") : undefined,
  dryRun: Boolean(flags["dry-run"]),
});
console.log(`written=${result.written.length} skipped=${result.skipped.length}`);
