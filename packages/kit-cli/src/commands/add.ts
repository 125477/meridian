import { resolve } from "node:path";
import type { Command } from "commander";
import { addToProject } from "@meridian/engine";

export function registerAdd(program: Command): void {
  program
    .command("add")
    .argument("[feature]", "storybook | docs | adapter | i18n | themes | optimize | desktop")
    .option("--path <dir>", "项目目录", ".")
    .option("--modules <list>", "逗号分隔的 UI 模块 id")
    .option("--dry-run", "只预览，不写盘", false)
    .option("--json", "JSON 输出", false)
    .action(async (feature, opts) => {
      const result = await addToProject({
        projectDir: resolve(String(opts.path)),
        feature,
        modules: opts.modules ? String(opts.modules).split(",").map((s) => s.trim()) : undefined,
        dryRun: Boolean(opts.dryRun),
      });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      if (opts.dryRun) console.log("Dry-run：");
      console.log(`新增 ${result.written.length} 个文件，跳过 ${result.skipped.length} 个已有文件`);
    });
}
