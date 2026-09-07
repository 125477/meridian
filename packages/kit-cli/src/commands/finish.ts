import { resolve } from "node:path";
import type { Command } from "commander";
import { finishScaffold } from "@meridian/engine";

export function registerFinish(program: Command): void {
  program
    .command("finish")
    .argument("[path]", "项目目录", ".")
    .option("--dry-run", "只预览，不写盘", false)
    .option("--json", "JSON 输出", false)
    .action(async (path, opts) => {
      const result = await finishScaffold(resolve(path), { dryRun: Boolean(opts.dryRun) });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      const prefix = result.dryRun ? "Dry-run 将更新：" : "已更新：";
      console.log(result.changed.length ? `${prefix}${result.changed.join(", ")}` : "无需改动");
    });
}
