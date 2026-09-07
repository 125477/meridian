import { CreateAnswersSchema, type CreateAnswers, type Platform } from "@meridian/schema";

const FALSE_WINS_KEYS = ["withDocs", "withI18n", "withThemes"] as const;

/**
 * 双引擎合并：规则基线 + LLM 建议。
 * docs / i18n / themes 采用 false 胜，避免误开；platform 用户 > 规则 > LLM。
 */
export function mergeAnswers(options: {
  matrix: CreateAnswers;
  llm?: Partial<CreateAnswers>;
  userPlatform?: Platform;
}): CreateAnswers {
  const llm = options.llm ?? {};
  const merged: Record<string, unknown> = { ...options.matrix, ...llm };

  for (const key of FALSE_WINS_KEYS) {
    const matrixVal = options.matrix[key];
    const llmVal = llm[key];
    merged[key] = Boolean(matrixVal) && Boolean(llmVal);
  }

  if (options.userPlatform) {
    merged.platform = options.userPlatform;
  } else {
    merged.platform = options.matrix.platform ?? llm.platform;
  }

  return CreateAnswersSchema.parse(merged);
}
