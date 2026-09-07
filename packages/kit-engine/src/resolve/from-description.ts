import {
  CreateAnswersSchema,
  MeridianError,
  MeridianErrorCode,
  type CreateAnswers,
  type Resolution,
  type UiModuleId,
} from "@meridian/schema";
import { loadStackMap, type CueDef, type KindDef, type StackMap } from "../catalog/stack-map.js";
import {
  filterModulesForUi,
  listModuleIds,
  matchModulesFromDescription,
  mergeModuleIds,
} from "../catalog/stack-modules.js";

export interface ResolveInput {
  description: string;
  name?: string;
  platform?: CreateAnswers["platform"];
  ui?: CreateAnswers["ui"];
  modules?: string[];
  stackMap?: StackMap;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function containsKeyword(haystack: string, keyword: string): boolean {
  return haystack.includes(keyword.toLowerCase());
}

function scoreKind(normalized: string, kind: KindDef, matchedCues: CueDef[]): number {
  let score = kind.weight;
  for (const keyword of kind.keywords) {
    if (containsKeyword(normalized, keyword)) score += 12;
  }
  for (const cue of matchedCues) {
    score += cue.weight;
  }
  return score;
}

function matchCues(normalized: string, cues: CueDef[]): CueDef[] {
  return cues.filter((cue) => cue.keywords.some((kw) => containsKeyword(normalized, kw)));
}

function confidenceFromGap(top: number, second: number): Resolution["confidence"] {
  const gap = top - second;
  if (gap >= 30) return "high";
  if (gap >= 10) return "medium";
  return "low";
}

function applyConservativeSignals(description: string, answers: CreateAnswers): CreateAnswers {
  const text = description.toLowerCase();
  const next = { ...answers };
  const i18nHit = /国际化|i18n|多语言|multilingual|双语/.test(text);
  const docsHit = /文档站|rspress|技术文档站/.test(text);
  const themeHit = /多主题|换肤|theme switcher|多套主题/.test(text);
  const adapterHit = /adapter|适配层|sdk 适配|宿主适配/.test(text);
  const storybookHit = /storybook|组件预览/.test(text);
  const desktopHit = /桌面端|桌面应用|桌面客户端/.test(text);
  const vueHit = /(^|\s)vue(\s|$)|vue3|vue 3/.test(text);

  next.withI18n = i18nHit;
  next.withDocs = docsHit;
  next.withThemes = themeHit;
  next.withAdapter = adapterHit || next.withAdapter;
  next.withStorybook = storybookHit || next.withStorybook;
  if (desktopHit) {
    next.withDesktop = true;
    next.platform = "pc-desktop";
  }
  if (vueHit) next.ui = "vue";
  return next;
}

export function resolveFromDescription(input: ResolveInput): Resolution {
  const description = input.description.trim();
  if (!description) {
    throw new MeridianError(MeridianErrorCode.CONSTRAINT_VIOLATION, "描述不能为空");
  }
  const map = input.stackMap ?? loadStackMap();
  const normalized = normalize(description);
  const cues = matchCues(normalized, map.cues);

  const ranked = map.kinds
    .map((kind) => {
      const kindCues = cues.filter((cue) => kind.requiredCues.length === 0 || kind.requiredCues.includes(cue.id));
      const requiredOk = kind.requiredCues.every((id) => cues.some((cue) => cue.id === id));
      if (!requiredOk && kind.requiredCues.length > 0) {
        return { kind, score: Number.NEGATIVE_INFINITY, reasons: [] as string[] };
      }
      const score = scoreKind(normalized, kind, cues);
      const reasons = [
        `匹配类型「${kind.title}」`,
        ...kind.keywords.filter((kw) => containsKeyword(normalized, kw)).map((kw) => `关键词: ${kw}`),
        ...cues.map((cue) => `信号: ${cue.id}`),
      ];
      return { kind, score, reasons, kindCues };
    })
    .filter((row) => Number.isFinite(row.score))
    .sort((a, b) => b.score - a.score);

  const winner = ranked[0];
  if (!winner) {
    throw new MeridianError(MeridianErrorCode.BLUEPRINT_NOT_FOUND, "没有匹配到任何项目类型");
  }
  const runnerUp = ranked[1];
  const mergedAnswers: Record<string, unknown> = {
    ...winner.kind.answers,
  };
  for (const cue of cues) {
    Object.assign(mergedAnswers, cue.apply);
  }
  if (input.platform) mergedAnswers.platform = input.platform;
  if (input.ui) mergedAnswers.ui = input.ui;

  let answers = CreateAnswersSchema.parse(mergedAnswers);
  answers = applyConservativeSignals(description, answers);
  if (input.platform) answers = { ...answers, platform: input.platform };
  if (input.ui) answers = { ...answers, ui: input.ui };
  const inferredModules = matchModulesFromDescription(description);
  answers = {
    ...answers,
    description,
    modules: filterModulesForUi(
      mergeModuleIds(answers.modules, inferredModules, input.modules),
      answers.ui,
    ) as UiModuleId[],
  };

  return {
    blueprintId: winner.kind.blueprint,
    kindId: winner.kind.id,
    confidence: confidenceFromGap(winner.score, runnerUp?.score ?? 0),
    score: winner.score,
    reasons: winner.reasons,
    answers,
    warnings: winner.score < 20 ? ["匹配分较低，建议人工确认蓝图"] : [],
  };
}

export function listCapabilityCatalog(stackMap?: StackMap): {
  kinds: Array<{ id: string; title: string; blueprint: string }>;
  cues: Array<{ id: string; keywords: string[] }>;
  modules: string[];
} {
  const map = stackMap ?? loadStackMap();
  return {
    kinds: map.kinds.map((k) => ({ id: k.id, title: k.title, blueprint: k.blueprint })),
    cues: map.cues.map((c) => ({ id: c.id, keywords: c.keywords })),
    modules: listModuleIds(),
  };
}
