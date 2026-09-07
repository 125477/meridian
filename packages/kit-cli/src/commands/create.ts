import { spawnSync } from "node:child_process";
import { basename, resolve } from "node:path";
import type { Command } from "commander";
import { createProject } from "@meridian/engine";
import { MeridianError, MeridianErrorCode, isValidProjectName, type CreateAnswers } from "@meridian/schema";
import { runInteractiveCreate } from "../prompts/create-flow.js";

export function registerCreate(program: Command): void {
  program
    .command("create")
    .argument("[name]", "项目名")
    .option("--blueprint <id>", "指定蓝图，跳过描述推荐")
    .option("--describe <text>", "项目描述，用于规则选型；有描述时自动 finish")
    .option("--platform <target>", "pc-web | h5 | pc-desktop")
    .option("--ui <framework>", "react | vue")
    .option("--with-storybook", "包含组件画廊")
    .option("--with-docs", "包含文档站")
    .option("--with-adapter", "包含 adapter 层")
    .option("--i18n", "开启国际化")
    .option("--themes", "开启多主题")
    .option("--optimize", "开启打包体积优化")
    .option("--no-optimize", "关闭打包体积优化")
    .option("--modules <list>", "逗号分隔的 UI 模块 id")
    .option("--layers <list>", "逗号分隔层，含 adapter 则开启适配层")
    .option("--catalog <url>", "远程蓝图目录 JSON")
    .option("--blueprint-source <url>", "直接指定远程蓝图源")
    .option("--registry <url>", "写入生成项目 .npmrc 的 registry")
    .option("--yes", "跳过确认")
    .option("--dry-run", "只打印将写入的文件")
    .option("--force", "允许写入非空目录")
    .option("--no-finish", "即使有描述也不跑生成后定制")
    .option("--no-git", "不执行 git init")
    .option("--no-install", "不执行包安装")
    .option("--out <dir>", "输出目录（默认 ./<项目名>）")
    .option("--json", "机器可读输出")
    .action(async (name: string | undefined, opts: Record<string, unknown>) => {
      const parsed = parseNameAndOut(name, opts.out ? String(opts.out) : undefined);
      const flagAnswers = collectFlagAnswers(opts);

      let projectName = parsed.name;
      let description = String(opts.describe ?? "");
      let blueprintId = opts.blueprint ? String(opts.blueprint) : undefined;
      let promptAnswers: Partial<CreateAnswers> = {};

      if (!opts.yes && !opts.dryRun) {
        const interactive = await runInteractiveCreate({
          name: projectName,
          description: description || undefined,
          blueprintId,
          platform: opts.platform as CreateAnswers["platform"] | undefined,
          ui: opts.ui as CreateAnswers["ui"] | undefined,
          yes: false,
        });
        projectName = interactive.name;
        description = interactive.description ?? description;
        blueprintId = interactive.blueprintId;
        promptAnswers = interactive.answers;
      } else {
        if (!projectName || !isValidProjectName(projectName)) {
          throw new MeridianError(MeridianErrorCode.INVALID_PROJECT_NAME, "非交互模式必须提供合法项目名");
        }
      }

      const result = await createProject({
        name: projectName,
        targetDir: parsed.out ? resolve(parsed.out) : undefined,
        blueprintId,
        description: description || undefined,
        platform: opts.platform as never,
        ui: opts.ui as never,
        force: Boolean(opts.force),
        dryRun: Boolean(opts.dryRun),
        skipFinish: opts.finish === false,
        catalogUrl: opts.catalog ? String(opts.catalog) : undefined,
        blueprintSource: opts.blueprintSource ? String(opts.blueprintSource) : undefined,
        registry: opts.registry ? String(opts.registry) : undefined,
        layers: opts.layers ? String(opts.layers).split(",").map((s) => s.trim()) : undefined,
        modules: opts.modules ? String(opts.modules).split(",").map((s) => s.trim()) : undefined,
        answers: { ...promptAnswers, ...flagAnswers },
      });

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.commit.dryRun) {
        console.log("Dry-run 文件清单：");
        for (const file of result.commit.written) console.log(`  ${file}`);
        return;
      }

      const dir = result.plan.targetDir;
      if (opts.git !== false) gitInit(dir);
      if (opts.install !== false) install(dir, result.plan.answers.packageManager);

      console.log(`\n✔ 项目已创建：${dir}`);
      console.log("\n下一步：");
      console.log(`  cd ${dir}`);
      console.log("  pnpm dev");
      if (result.plan.answers.description) {
        console.log("\n已根据描述完成生成后定制。可用 meridian doctor 复查。");
      }
    });
}

function collectFlagAnswers(opts: Record<string, unknown>): Partial<CreateAnswers> {
  const answers: Partial<CreateAnswers> = {
    ...(opts.withStorybook ? { withStorybook: true } : {}),
    ...(opts.withDocs ? { withDocs: true } : {}),
    ...(opts.withAdapter ? { withAdapter: true } : {}),
    ...(opts.i18n ? { withI18n: true } : {}),
    ...(opts.themes ? { withThemes: true } : {}),
  };
  if (opts.optimize === true) answers.withOptimize = true;
  if (opts.optimize === false || opts.noOptimize) answers.withOptimize = false;
  return answers;
}

function parseNameAndOut(
  raw: string | undefined,
  outOpt: string | undefined,
): { name?: string; out?: string } {
  if (outOpt) {
    return { name: raw, out: outOpt };
  }
  if (raw && (raw.includes("/") || raw.includes("\\"))) {
    return { name: basename(raw.replace(/[\\/]+$/, "")), out: raw };
  }
  return { name: raw };
}

function gitInit(dir: string): void {
  spawnSync("git", ["init"], { cwd: dir, stdio: "ignore" });
}

function install(dir: string, pm: string): void {
  const cmd = pm === "npm" ? "npm" : pm === "yarn" ? "yarn" : "pnpm";
  spawnSync(cmd, ["install"], { cwd: resolve(dir), stdio: "inherit" });
}
