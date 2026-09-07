import { mkdtemp, rm, mkdir, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Command } from "commander";
import { createProject, inspectProject, listLocalBlueprints } from "@meridian/engine";
import { diffGolden, formatGoldenDiff } from "../utils/golden-diff.js";
import { runCommand } from "../utils/ci-run.js";

function repoRoot(): string {
  return process.env.MERIDIAN_HOME ?? resolve(process.cwd());
}

function goldenDir(blueprintId: string): string {
  return join(repoRoot(), "examples", "golden", blueprintId);
}

export function registerCi(program: Command): void {
  const ci = program.command("ci").description("生成校验");

  ci.command("verify")
    .option("--blueprint <id>", "蓝图 id；省略则校验全部")
    .option("--doctor-only", "只跑 doctor", false)
    .option("--skip-install", "跳过 pnpm install", false)
    .option("--skip-build", "跳过 pnpm build", false)
    .action(async (opts) => {
      const ids = opts.blueprint
        ? [String(opts.blueprint)]
        : listLocalBlueprints().map((item) => item.manifest.id);
      let failed = false;
      for (const id of ids) {
        console.log(`→ verify ${id}`);
        const dir = await mkdtemp(join(tmpdir(), `meridian-ci-${id}-`));
        try {
          await createProject({
            name: `ci-${id}`,
            targetDir: dir,
            blueprintId: id,
            force: true,
            skipFinish: true,
          });
          const report = await inspectProject(dir);
          if (!report.ok) {
            console.error(JSON.stringify(report, null, 2));
            failed = true;
            continue;
          }
          console.log("  ✔ doctor");
          if (!opts.doctorOnly && !opts.skipInstall) {
            const install = runCommand(dir, "pnpm", ["install"]);
            if (!install.ok) {
              console.error(install.stderr);
              failed = true;
              continue;
            }
            console.log("  ✔ pnpm install");
          }
          if (!opts.doctorOnly && !opts.skipBuild && !opts.skipInstall) {
            const build = runCommand(dir, "pnpm", ["build"]);
            if (!build.ok) {
              console.error(build.stderr);
              failed = true;
              continue;
            }
            console.log("  ✔ pnpm build");
          }
          console.log(`✔ ${id} ok`);
        } finally {
          await rm(dir, { recursive: true, force: true });
        }
      }
      if (failed) process.exitCode = 1;
    });

  ci.command("diff")
    .option("--blueprint <id>", "蓝图 id；省略则对比全部")
    .action(async (opts) => {
      const ids = opts.blueprint
        ? [String(opts.blueprint)]
        : listLocalBlueprints().map((item) => item.manifest.id);
      let failed = false;
      for (const id of ids) {
        const dir = await mkdtemp(join(tmpdir(), `meridian-diff-${id}-`));
        try {
          await createProject({
            name: `ci-${id}`,
            targetDir: dir,
            blueprintId: id,
            force: true,
            skipFinish: true,
          });
          const diff = await diffGolden(dir, goldenDir(id));
          console.log(formatGoldenDiff(id, diff));
          if (!diff.ok) failed = true;
        } finally {
          await rm(dir, { recursive: true, force: true });
        }
      }
      if (failed) process.exitCode = 1;
    });

  ci.command("snapshot")
    .requiredOption("--blueprint <id>", "蓝图 id")
    .action(async (opts) => {
      const id = String(opts.blueprint);
      const dir = await mkdtemp(join(tmpdir(), `meridian-snap-${id}-`));
      const dest = goldenDir(id);
      try {
        await createProject({
          name: `ci-${id}`,
          targetDir: dir,
          blueprintId: id,
          force: true,
          skipFinish: true,
        });
        await rm(dest, { recursive: true, force: true });
        await mkdir(dest, { recursive: true });
        await cp(dir, dest, {
          recursive: true,
          filter: (src) => !src.includes("node_modules") && !src.includes(".meridian-journal.json"),
        });
        console.log(`✔ Snapshot written to ${dest}`);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
}
