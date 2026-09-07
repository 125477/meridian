import { resolve } from "node:path";
import type { Command } from "commander";
import { inspectProject } from "@meridian/engine";

export function registerDoctor(program: Command): void {
  program
    .command("doctor")
    .argument("[path]", "项目目录", ".")
    .option("--json", "JSON 输出", false)
    .action(async (path, opts) => {
      const report = await inspectProject(resolve(path));
      if (opts.json) {
        console.log(JSON.stringify(report, null, 2));
      } else {
        for (const item of report.findings) {
          const mark = item.level === "error" ? "✖" : item.level === "warn" ? "!" : "i";
          console.log(`${mark} [${item.level}] ${item.message}`);
        }
        console.log(report.ok ? "\n✔ doctor 通过" : "\n✖ doctor 未通过");
      }
      if (!report.ok) process.exitCode = 1;
    });
}
