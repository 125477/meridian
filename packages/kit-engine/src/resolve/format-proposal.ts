import type { CreateAnswers, Resolution } from "@meridian/schema";
import { listModuleIds } from "../catalog/stack-modules.js";

export function formatMappingSection(resolution: Resolution, name = "my-app"): string {
  const a = resolution.answers;
  const flags = createFlags(name, resolution);
  return [
    "## §4 Meridian 映射",
    "",
    `- 蓝图: \`${resolution.blueprintId}\`（${resolution.kindId}，置信度 ${resolution.confidence}）`,
    `- 平台: \`${a.platform}\``,
    `- UI: \`${a.ui}\``,
    `- 开关: storybook=${a.withStorybook} docs=${a.withDocs} adapter=${a.withAdapter} i18n=${a.withI18n} themes=${a.withThemes} optimize=${a.withOptimize} desktop=${a.withDesktop}`,
    `- 模块: ${a.modules.length ? a.modules.join(", ") : "（无）"}`,
    `- 理由: ${resolution.reasons.slice(0, 6).join("；")}`,
    resolution.warnings.length ? `- 警告: ${resolution.warnings.join("；")}` : "",
    "",
    "```bash",
    flags,
    "```",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function formatTechnicalProposal(options: {
  projectName: string;
  description: string;
  resolution: Resolution;
  llmNarrative?: string;
}): string {
  const { projectName, description, resolution, llmNarrative } = options;
  const a = resolution.answers;
  const lines = [
    `# 技术选型方案 — ${projectName}`,
    "",
    "## §1 需求理解",
    "",
    description.trim() || "（未提供描述）",
    "",
    "## §2 全网推荐",
    "",
    llmNarrative?.trim() ||
      [
        "本次仅使用规则引擎（未调用 LLM）。",
        `推荐蓝图 \`${resolution.blueprintId}\`，UI \`${a.ui}\`，平台 \`${a.platform}\`。`,
        "可执行 \`meridian resolve --describe \"...\" --llm\` 补充全网选型叙述。",
      ].join("\n"),
    "",
    formatMappingSection(resolution, projectName),
    "",
    "## §8 建议创建命令",
    "",
    "```bash",
    createFlags(projectName, resolution),
    "```",
    "",
    "确认后执行上述命令（或回复「确认 / 创建」）。",
  ];
  return lines.join("\n");
}

export function formatCatalogText(options: {
  kinds: Array<{ id: string; title: string; blueprint: string }>;
  cues: Array<{ id: string; keywords: string[] }>;
}): string {
  const moduleIds = listModuleIds();
  return [
    "项目类型：",
    ...options.kinds.map((k) => `  ${k.id.padEnd(22)} ${k.blueprint}  (${k.title})`),
    "",
    "信号：",
    ...options.cues.map((c) => `  ${c.id.padEnd(22)} ${c.keywords.slice(0, 4).join(", ")}`),
    "",
    `UI 模块: ${moduleIds.join(", ")}`,
  ].join("\n");
}

export function formatAnswerSummary(answers: CreateAnswers): string[] {
  return [
    `ui=${answers.ui}`,
    `platform=${answers.platform}`,
    `storybook=${answers.withStorybook}`,
    `docs=${answers.withDocs}`,
    `adapter=${answers.withAdapter}`,
    `i18n=${answers.withI18n}`,
    `themes=${answers.withThemes}`,
    `optimize=${answers.withOptimize}`,
    `desktop=${answers.withDesktop}`,
    answers.modules.length ? `modules=${answers.modules.join(",")}` : "",
  ].filter(Boolean);
}

function createFlags(name: string, resolution: Resolution): string {
  const a = resolution.answers;
  const parts = [
    `meridian create ${name}`,
    `--blueprint ${resolution.blueprintId}`,
    `--platform ${a.platform}`,
    `--ui ${a.ui}`,
  ];
  if (a.withStorybook) parts.push("--with-storybook");
  if (a.withDocs) parts.push("--with-docs");
  if (a.withAdapter) parts.push("--with-adapter");
  if (a.withI18n) parts.push("--i18n");
  if (a.withThemes) parts.push("--themes");
  if (a.withOptimize) parts.push("--optimize");
  else parts.push("--no-optimize");
  if (a.modules.length) parts.push(`--modules ${a.modules.join(",")}`);
  if (a.description) parts.push(`--describe ${JSON.stringify(a.description)}`);
  parts.push("--yes");
  return parts.join(" ");
}
