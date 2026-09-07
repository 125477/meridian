#!/usr/bin/env node
import { resolve } from "node:path";
import { loadEngine, parseArgs } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const engine = await loadEngine();
const report = await engine.inspectProject(resolve(positional[0] ?? "."));
for (const item of report.findings) {
  console.log(`[${item.level}] ${item.message}`);
}
if (!report.ok) process.exit(1);
console.log("✔ doctor 通过");
