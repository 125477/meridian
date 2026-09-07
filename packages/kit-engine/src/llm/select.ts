import { readFile } from "node:fs/promises";
import { MeridianError, MeridianErrorCode, CreateAnswersSchema, type CreateAnswers } from "@meridian/schema";

export interface LlmConfig {
  baseUrl: string;
  apiKey?: string;
  model: string;
  timeoutMs: number;
  prompt: string;
}

export function readLlmConfig(prompt: string): LlmConfig {
  const baseUrl = process.env.MERIDIAN_LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const apiKey = process.env.MERIDIAN_LLM_API_KEY ?? process.env.OPENAI_API_KEY;
  const model = process.env.MERIDIAN_LLM_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const timeoutMs = Number(process.env.MERIDIAN_LLM_TIMEOUT_MS ?? "120000");
  const isLocal = /localhost|127\.0\.0\.1/.test(baseUrl);
  if (!apiKey && !isLocal) {
    throw new MeridianError(
      MeridianErrorCode.LLM_CONFIG_MISSING,
      "云端 LLM 需要 MERIDIAN_LLM_API_KEY（或 OPENAI_API_KEY）。本地 127.0.0.1 可省略。",
    );
  }
  return { baseUrl, apiKey, model, timeoutMs, prompt };
}

export async function runLlmSelection(options: {
  description: string;
  extraContext?: string;
  promptPath?: string;
}): Promise<{ narrative: string; answers?: Partial<CreateAnswers> }> {
  const promptText = options.promptPath ? await readFile(options.promptPath, "utf8") : DEFAULT_PROMPT;
  const config = readLlmConfig(promptText);
  const user = [
    `项目描述:\n${options.description}`,
    options.extraContext ? `补充上下文:\n${options.extraContext}` : "",
    "请输出：1) 技术选型叙述 2) 最后一行 JSON，格式 {\"forge-answers\" 不要用这个键，用 \"meridianAnswers\": { ui, platform, withDocs, withI18n, withThemes } }",
  ]
    .filter(Boolean)
    .join("\n\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: config.prompt },
          { role: "user", content: user },
        ],
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new MeridianError(MeridianErrorCode.LLM_REQUEST_FAILED, `LLM 请求失败: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const narrative = data.choices?.[0]?.message?.content ?? "";
    return { narrative, answers: extractAnswers(narrative) };
  } catch (error) {
    if (error instanceof MeridianError) throw error;
    throw new MeridianError(MeridianErrorCode.LLM_REQUEST_FAILED, `LLM 调用异常: ${String(error)}`);
  } finally {
    clearTimeout(timer);
  }
}

function extractAnswers(text: string): Partial<CreateAnswers> | undefined {
  const blobs = text.match(/\{[\s\S]*\}/g) ?? [];
  for (const blob of blobs.reverse()) {
    try {
      const parsed = JSON.parse(blob) as {
        meridianAnswers?: unknown;
        kitAnswers?: unknown;
        "forge-answers"?: unknown;
        forgeAnswers?: unknown;
      };
      const raw =
        parsed.meridianAnswers ?? parsed.kitAnswers ?? parsed["forge-answers"] ?? parsed.forgeAnswers;
      if (!raw) continue;
      const result = CreateAnswersSchema.partial().safeParse(raw);
      if (result.success) return result.data;
    } catch {
      continue;
    }
  }
  return undefined;
}

const DEFAULT_PROMPT = `你是前端架构顾问。根据项目描述给出可落地的技术选型。
约束：
- 只推荐宽松许可证（MIT / Apache-2.0 / BSD）依赖
- 区分「可立即脚手架」与「生成后自建」
- 不要假装工具已经内置后端、数据库或 Agent 运行时
- 保守：没有明确说国际化 / 文档站 / 多主题就不要打开这些开关`;
