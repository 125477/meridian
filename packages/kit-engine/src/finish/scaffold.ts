import { join } from "node:path";
import { pathExists, readTextFile, writeTextFile } from "../fsutil.js";
import { readProjectMeta } from "../doctor/inspect.js";
import { SECTION_MARK_END, SECTION_MARK_START } from "../constants.js";

export interface FinishResult {
  changed: string[];
  dryRun?: boolean;
}

/**
 * 生成后定制：按已启用 feature 裁剪文档章节、替换规则占位符、补环境示例。
 * 仅在创建时提供了描述，或用户显式调用 finish 时执行。
 */
export async function finishScaffold(projectDir: string, options: { dryRun?: boolean } = {}): Promise<FinishResult> {
  const meta = await readProjectMeta(projectDir);
  const changed: string[] = [];
  const enabled = new Set(meta.features);
  const dryRun = Boolean(options.dryRun);

  const agentsPath = join(projectDir, "AGENTS.md");
  if (await pathExists(agentsPath)) {
    const original = await readTextFile(agentsPath);
    const trimmed = trimSections(original, enabled);
    if (trimmed !== original) {
      if (!dryRun) await writeTextFile(agentsPath, trimmed);
      changed.push("AGENTS.md");
    }
  }

  const rulePath = join(projectDir, ".cursor/rules/architecture.md");
  if (await pathExists(rulePath)) {
    const original = await readTextFile(rulePath);
    const replaced = original.replaceAll("{{projectName}}", basenameSafe(projectDir, meta));
    if (replaced !== original) {
      if (!dryRun) await writeTextFile(rulePath, replaced);
      changed.push(".cursor/rules/architecture.md");
    }
  }

  const envPath = join(projectDir, ".env.example");
  if (!(await pathExists(envPath))) {
    if (!dryRun) {
      await writeTextFile(
        envPath,
        [
          "# 复制为 .env.local 后填写。不要把真实密钥提交到仓库。",
          "VITE_APP_TITLE=",
          "VITE_API_BASE_URL=",
          "",
        ].join("\n"),
      );
    }
    changed.push(".env.example");
  }

  const skillHint = join(projectDir, ".agents/skills/README.md");
  if (await pathExists(skillHint)) {
    const original = await readTextFile(skillHint);
    const replaced = original.replaceAll("{{projectName}}", basenameSafe(projectDir, meta));
    if (replaced !== original) {
      if (!dryRun) await writeTextFile(skillHint, replaced);
      changed.push(".agents/skills/README.md");
    }
  }

  return { changed, dryRun };
}

function basenameSafe(projectDir: string, _meta: { answers: { description?: string } }): string {
  const parts = projectDir.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] ?? "app";
}

function trimSections(markdown: string, enabled: Set<string>): string {
  const re =
    /<!-- meridian:section:([a-z0-9-]+) -->[\s\S]*?<!-- \/meridian:section:\1 -->\n?/g;
  return markdown.replace(re, (block, name: string) => (enabled.has(name) ? block : ""));
}

export { SECTION_MARK_START, SECTION_MARK_END };
