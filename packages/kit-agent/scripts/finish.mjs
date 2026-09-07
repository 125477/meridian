#!/usr/bin/env node
import { resolve } from "node:path";
import { loadEngine, parseArgs } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const engine = await loadEngine();
const result = await engine.finishScaffold(resolve(positional[0] ?? "."), {
  dryRun: Boolean(flags["dry-run"]),
});
console.log(result.changed.length ? result.changed.join("\n") : "no changes");
