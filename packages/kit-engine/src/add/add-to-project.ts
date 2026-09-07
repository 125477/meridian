import { basename, join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { FeatureIdSchema, MeridianError, MeridianErrorCode, type CreateAnswers, type FeatureId } from "@meridian/schema";
import { loadBlueprint } from "../catalog/blueprints.js";
import { assertKnownModules, filterModulesForUi, mergeModuleIds } from "../catalog/stack-modules.js";
import { readProjectMeta } from "../doctor/inspect.js";
import { buildPlan, metaPath } from "../plan/build-plan.js";
import { buildPackageDepSets } from "../plan/package-deps.js";
import { commitPlan, type CommitResult } from "../write/commit.js";
import { writeTextFile } from "../fsutil.js";

const FEATURE_TO_ANSWERS: Record<FeatureId, Partial<CreateAnswers>> = {
  storybook: { withStorybook: true },
  docs: { withDocs: true },
  adapter: { withAdapter: true },
  i18n: { withI18n: true },
  themes: { withThemes: true },
  optimize: { withOptimize: true },
  desktop: { withDesktop: true, platform: "pc-desktop" },
};

export interface AddInput {
  projectDir: string;
  feature?: string;
  modules?: string[];
  dryRun?: boolean;
}

export async function addToProject(input: AddInput): Promise<CommitResult> {
  const meta = await readProjectMeta(input.projectDir);
  const answers: CreateAnswers = { ...meta.answers };

  if (input.feature) {
    const parsed = FeatureIdSchema.safeParse(input.feature);
    if (!parsed.success) {
      throw new MeridianError(MeridianErrorCode.FEATURE_UNKNOWN, `未知特性: ${input.feature}`);
    }
    Object.assign(answers, FEATURE_TO_ANSWERS[parsed.data]);
  }
  if (input.modules?.length) {
    assertKnownModules(input.modules);
    answers.modules = filterModulesForUi(
      mergeModuleIds(answers.modules, input.modules),
      answers.ui,
    ) as CreateAnswers["modules"];
  }

  if (!input.feature && !input.modules?.length) {
    throw new MeridianError(MeridianErrorCode.FEATURE_UNKNOWN, "请指定特性（storybook|docs|…）或 --modules");
  }

  const blueprint = loadBlueprint(meta.blueprintId);
  const plan = await buildPlan({
    blueprint,
    projectName: basename(input.projectDir),
    targetDir: input.projectDir,
    answers,
  });
  const result = await commitPlan(plan, {
    skipExisting: true,
    force: true,
    dryRun: input.dryRun,
  });

  if (!input.dryRun) {
    await mergeUiDependencies(input.projectDir, answers);
    const nextMeta = {
      ...meta,
      answers,
      features: plan.features,
      layers: plan.layers,
      apps: plan.apps,
    };
    await writeTextFile(metaPath(input.projectDir), `${JSON.stringify(nextMeta, null, 2)}\n`);
  }
  return result;
}

async function mergeUiDependencies(projectDir: string, answers: CreateAnswers): Promise<void> {
  const uiPkgPath = join(projectDir, "packages/ui/package.json");
  let raw: string;
  try {
    raw = await readFile(uiPkgPath, "utf8");
  } catch {
    return;
  }
  const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> };
  const deps = buildPackageDepSets(basename(projectDir), answers).uiDependencies;
  if (Object.keys(deps).length === 0) return;
  pkg.dependencies = { ...pkg.dependencies, ...deps };
  await writeFile(uiPkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}
