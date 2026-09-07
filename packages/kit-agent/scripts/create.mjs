#!/usr/bin/env node
import { loadEngine, parseArgs } from "./lib.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const name = positional[0];
if (!name) {
  console.error("用法: node create.mjs <name> --describe \"...\" [--platform pc-web] [--blueprint id] [--modules a,b] --yes");
  process.exit(1);
}

const engine = await loadEngine();
const result = await engine.createProject({
  name,
  description: flags.describe ? String(flags.describe) : undefined,
  blueprintId: flags.blueprint ? String(flags.blueprint) : undefined,
  platform: flags.platform,
  ui: flags.ui,
  force: Boolean(flags.force),
  dryRun: Boolean(flags["dry-run"]),
  skipFinish: Boolean(flags["no-finish"]),
  catalogUrl: flags.catalog ? String(flags.catalog) : undefined,
  blueprintSource: flags["blueprint-source"] ? String(flags["blueprint-source"]) : undefined,
  registry: flags.registry ? String(flags.registry) : undefined,
  layers: flags.layers ? String(flags.layers).split(",") : undefined,
  modules: flags.modules ? String(flags.modules).split(",") : undefined,
  answers: {
    ...(flags["with-storybook"] ? { withStorybook: true } : {}),
    ...(flags["with-docs"] ? { withDocs: true } : {}),
    ...(flags["with-adapter"] ? { withAdapter: true } : {}),
    ...(flags.i18n ? { withI18n: true } : {}),
    ...(flags.themes ? { withThemes: true } : {}),
    ...(flags.optimize ? { withOptimize: true } : {}),
    ...(flags["no-optimize"] ? { withOptimize: false } : {}),
  },
});

console.log(`✔ 已创建 ${result.plan.targetDir}（${result.plan.files.length} 个文件）`);
console.log(`蓝图: ${result.plan.blueprintId}  doctor: ${result.doctorOk ? "ok" : "check"}`);
