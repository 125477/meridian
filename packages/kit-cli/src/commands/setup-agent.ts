import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "commander";

const IDE_DIRS: Record<string, string> = {
  cursor: ".cursor/skills",
  windsurf: ".codeium/windsurf/skills",
  claude: ".claude/skills",
  agents: ".agents/skills",
};

export function registerSetupAgent(program: Command): void {
  program
    .command("setup-agent")
    .description("安装自包含 Agent Skill（脚本加载同一套 kit-engine）")
    .option("--ide <name>", "cursor | windsurf | claude | agents | all", "all")
    .option("--scope <name>", "global | project", "global")
    .option("--target <dir>", "覆盖 skills 目录")
    .option("--dry-run", "只打印安装路径", false)
    .action((opts) => {
      const ides = opts.ide === "all" ? Object.keys(IDE_DIRS) : [String(opts.ide)];
      const skillSrc = resolveAgentRoot();
      const repoRoot = join(skillSrc, "../..");
      for (const ide of ides) {
        const dest = resolveDest(ide, opts);
        if (!dest) {
          console.error(`未知 IDE: ${ide}`);
          process.exitCode = 1;
          continue;
        }
        console.log(`${opts.dryRun ? "→" : "✔"} ${dest}`);
        if (opts.dryRun) continue;
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(skillSrc, dest, { recursive: true });
        packVendor(dest, repoRoot);
        writeFileSync(join(dest, "kit-home.json"), `${JSON.stringify({ home: dest, layout: "vendor" }, null, 2)}\n`);
        writeFileSync(join(dest, ".installed-from"), `meridian@0.1.0\n`);
        console.log(`✔ 已安装 Skill 到 ${dest}`);
      }
    });
}

function resolveDest(ide: string, opts: { scope?: string; target?: string }): string | null {
  if (opts.target) return join(String(opts.target), "meridian");
  const rel = IDE_DIRS[ide];
  if (!rel) return null;
  const root = opts.scope === "project" ? process.cwd() : homedir();
  return join(root, rel, "meridian");
}

function resolveAgentRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, "../../kit-agent");
}

function packVendor(dest: string, repoRoot: string): void {
  const copies: Array<[string, string, string[]]> = [
    ["packages/kit-engine", "vendor/node_modules/@meridian/engine", ["package.json", "dist"]],
    ["packages/kit-schema", "vendor/node_modules/@meridian/schema", ["package.json", "dist"]],
    ["packages/kit-blueprints", "vendor/node_modules/@meridian/blueprints", ["package.json", "dist", "blueprints", "catalog"]],
  ];
  for (const [fromRel, toRel, parts] of copies) {
    const from = join(repoRoot, fromRel);
    const to = join(dest, toRel);
    mkdirSync(to, { recursive: true });
    for (const part of parts) {
      const src = join(from, part);
      if (!existsSync(src)) continue;
      cpSync(src, join(to, part), { recursive: true });
    }
  }
  try {
    const require = createRequire(join(repoRoot, "packages/kit-engine/package.json"));
    copyResolved(require, "zod", join(dest, "vendor/node_modules/zod"));
    copyResolved(require, "js-yaml", join(dest, "vendor/node_modules/js-yaml"));
  } catch {
    console.warn("⚠ 未能打包 zod / js-yaml，请在 meridian 仓库内使用 Skill，或设置 MERIDIAN_HOME");
  }
}

function copyResolved(require: NodeRequire, name: string, dest: string): void {
  const pkg = dirname(require.resolve(`${name}/package.json`));
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(pkg, dest, { recursive: true });
}
