import { basename, join } from "node:path";
import type { BlueprintManifest, CreateAnswers, GenerationPlan, LayerId, PlannedFile } from "@meridian/schema";
import { KIT_VERSION, TEMPLATE_SUFFIX } from "../constants.js";
import { matchGlob, relativePosix, toPosix, walkFiles } from "../fsutil.js";
import type { LoadedBlueprint } from "../catalog/blueprints.js";
import { lookup } from "../render/interpolate.js";
import { buildPackageDepSets } from "./package-deps.js";

function whenMatches(answers: CreateAnswers, when: { equals: [string, string | boolean | number] }): boolean {
  const [path, expected] = when.equals;
  const actual = lookup(answers as unknown as Record<string, unknown>, path);
  return actual === expected;
}

function shouldInclude(relativePath: string, manifest: BlueprintManifest, answers: CreateAnswers): boolean {
  for (const rule of manifest.pathRules) {
    if (!matchGlob(relativePath, rule.pattern)) continue;
    if (!whenMatches(answers, rule.when)) return false;
  }
  return true;
}

function applyRenames(relativePath: string, manifest: BlueprintManifest, answers: CreateAnswers): string {
  let result = relativePath;
  for (const rule of manifest.renameRules) {
    if (!whenMatches(answers, rule.when)) continue;
    if (result === rule.from || result.startsWith(`${rule.from}/`)) {
      result = rule.to + result.slice(rule.from.length);
    }
  }
  return result;
}

function deriveLayers(manifest: BlueprintManifest, answers: CreateAnswers): LayerId[] {
  const layers = new Set<LayerId>(manifest.layers);
  if (answers.withAdapter) layers.add("adapter");
  layers.add("apps");
  return [...layers];
}

function deriveApps(manifest: BlueprintManifest, answers: CreateAnswers): string[] {
  const apps = new Set(manifest.defaultApps);
  if (answers.withStorybook) apps.add("storybook");
  if (answers.withDocs) apps.add("docs");
  if (answers.withDesktop) apps.add("electron");
  return [...apps];
}

function deriveFeatures(answers: CreateAnswers): string[] {
  const features: string[] = [];
  if (answers.withStorybook) features.push("storybook");
  if (answers.withDocs) features.push("docs");
  if (answers.withAdapter) features.push("adapter");
  if (answers.withI18n) features.push("i18n");
  if (answers.withThemes) features.push("themes");
  if (answers.withOptimize) features.push("optimize");
  if (answers.withDesktop) features.push("desktop");
  return features;
}

export async function buildPlan(options: {
  blueprint: LoadedBlueprint;
  projectName: string;
  targetDir: string;
  answers: CreateAnswers;
}): Promise<GenerationPlan> {
  const { blueprint, projectName, targetDir, answers } = options;
  const sources = await walkFiles(blueprint.templateDir);
  const files: PlannedFile[] = [];

  for (const sourcePath of sources) {
    const relativeSource = relativePosix(blueprint.templateDir, sourcePath);
    if (basename(relativeSource) === ".meridianignore") continue;
    if (!shouldInclude(relativeSource, blueprint.manifest, answers)) continue;

    const isTemplate = relativeSource.endsWith(TEMPLATE_SUFFIX);
    const withoutSuffix = isTemplate
      ? relativeSource.slice(0, -TEMPLATE_SUFFIX.length)
      : relativeSource;
    const renamed = applyRenames(withoutSuffix, blueprint.manifest, answers);
    files.push({
      relativePath: toPosix(renamed),
      kind: isTemplate ? "render" : "copy",
      sourcePath,
    });
  }

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return {
    kitVersion: KIT_VERSION,
    blueprintId: blueprint.manifest.id,
    blueprintVersion: blueprint.manifest.version,
    projectName,
    targetDir,
    answers,
    layers: deriveLayers(blueprint.manifest, answers),
    apps: deriveApps(blueprint.manifest, answers),
    features: deriveFeatures(answers),
    files,
    createdAt: new Date().toISOString(),
  };
}

export function templateContext(plan: GenerationPlan): Record<string, unknown> {
  const deps = buildPackageDepSets(plan.projectName, plan.answers);
  return {
    projectName: plan.projectName,
    blueprintId: plan.blueprintId,
    kitVersion: plan.kitVersion,
    answers: plan.answers,
    layers: plan.layers,
    apps: plan.apps,
    features: plan.features,
    year: new Date().getFullYear(),
    ui: plan.answers.ui,
    platform: plan.answers.platform,
    withStorybook: plan.answers.withStorybook,
    withDocs: plan.answers.withDocs,
    withAdapter: plan.answers.withAdapter,
    withI18n: plan.answers.withI18n,
    withThemes: plan.answers.withThemes,
    withOptimize: plan.answers.withOptimize,
    withDesktop: plan.answers.withDesktop,
    packageManager: plan.answers.packageManager,
    registry: plan.answers.registry ?? "",
    isVue: deps.isVue,
    isReact: deps.isReact,
    isDesktop: deps.isDesktop,
    uiHasRuntimeDeps: deps.uiHasRuntimeDeps,
    uiDependencies: deps.uiDependencies,
    webDependencies: deps.webDependencies,
    webDevDependencies: deps.webDevDependencies,
    storybookDependencies: deps.storybookDependencies,
    storybookDevDependencies: deps.storybookDevDependencies,
    modules: plan.answers.modules,
  };
}

export function metaPath(targetDir: string): string {
  return join(targetDir, ".meridian", "project.json");
}
