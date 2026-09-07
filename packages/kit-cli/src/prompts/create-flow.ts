import * as clack from "@clack/prompts";
import {
  formatAnswerSummary,
  formatTechnicalProposal,
  loadBlueprint,
  listLocalBlueprints,
  resolveFromDescription,
  runLlmSelection,
} from "@meridian/engine";
import { MeridianError, MeridianErrorCode, isValidProjectName, type CreateAnswers } from "@meridian/schema";
import { runBlueprintPrompts } from "./blueprint-prompts.js";

export interface InteractiveCreateInput {
  name?: string;
  description?: string;
  blueprintId?: string;
  platform?: CreateAnswers["platform"];
  ui?: CreateAnswers["ui"];
  yes?: boolean;
}

export interface InteractiveCreateResult {
  name: string;
  description?: string;
  blueprintId: string;
  answers: Partial<CreateAnswers>;
}

export async function runInteractiveCreate(input: InteractiveCreateInput): Promise<InteractiveCreateResult> {
  const name = await ensureName(input.name, Boolean(input.yes));
  let description = input.description ?? "";
  let blueprintId = input.blueprintId;

  if (!blueprintId && !description && !input.yes) {
    const mode = await clack.select({
      message: "如何开始？",
      options: [
        { value: "describe", label: "用一句话描述项目（推荐）" },
        { value: "blueprint", label: "手动选择蓝图" },
        { value: "default", label: "默认 headless-workspace" },
      ],
    });
    if (clack.isCancel(mode)) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
    if (mode === "describe") {
      const text = await clack.text({ message: "项目描述", placeholder: "企业级无头分层前端工作区" });
      if (clack.isCancel(text) || !text) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
      description = text;
    } else if (mode === "blueprint") {
      const items = listLocalBlueprints();
      const picked = await clack.select({
        message: "选择蓝图",
        options: items.map((item) => ({ value: item.manifest.id, label: item.manifest.id })),
      });
      if (clack.isCancel(picked)) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
      blueprintId = String(picked);
    } else {
      blueprintId = "headless-workspace";
    }
  }

  const resolution = description
    ? resolveFromDescription({
        description,
        name,
        platform: input.platform,
        ui: input.ui,
      })
    : null;

  blueprintId = blueprintId ?? resolution?.blueprintId ?? "headless-workspace";
  let answers: Partial<CreateAnswers> = {
    ...(resolution?.answers ?? {}),
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.ui ? { ui: input.ui } : {}),
  };

  if (resolution) {
    let llmNarrative: string | undefined;
    if (process.env.MERIDIAN_LLM_API_KEY || process.env.OPENAI_API_KEY || /localhost|127\.0\.0\.1/.test(process.env.MERIDIAN_LLM_BASE_URL ?? "")) {
      try {
        const llm = await runLlmSelection({ description });
        llmNarrative = llm.narrative;
        if (llm.answers) answers = { ...answers, ...llm.answers };
      } catch (error) {
        clack.note(error instanceof Error ? error.message : String(error), "LLM 选型已跳过");
      }
    }
    clack.note(
      formatTechnicalProposal({
        projectName: name,
        description,
        resolution: { ...resolution, answers: resolution.answers },
        llmNarrative,
      }),
      "技术选型方案",
    );
    clack.note(formatAnswerSummary(resolution.answers).join("\n"), "规则引擎开关");
  }

  if (!input.yes) {
    const blueprint = loadBlueprint(blueprintId);
    answers = await runBlueprintPrompts(blueprint.manifest, answers);
    const ok = await clack.confirm({ message: `创建项目 ${name}？`, initialValue: true });
    if (clack.isCancel(ok) || !ok) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
  }

  return { name, description: description || undefined, blueprintId, answers };
}

async function ensureName(name: string | undefined, yes: boolean): Promise<string> {
  if (name && isValidProjectName(name)) return name;
  if (yes) throw new MeridianError(MeridianErrorCode.INVALID_PROJECT_NAME, "非交互模式必须提供合法项目名");
  const typed = await clack.text({ message: "项目名", placeholder: "my-app" });
  if (clack.isCancel(typed) || !typed) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
  if (!isValidProjectName(typed)) {
    throw new MeridianError(MeridianErrorCode.INVALID_PROJECT_NAME, `非法项目名: ${typed}`);
  }
  return typed;
}
