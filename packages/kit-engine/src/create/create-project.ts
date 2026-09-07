import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import {
  CreateAnswersSchema,
  MeridianError,
  MeridianErrorCode,
  isValidProjectName,
  toPackageName,
  type CreateAnswers,
  type GenerationPlan,
  type UiModuleId,
} from "@meridian/schema";
import { loadBlueprint } from "../catalog/blueprints.js";
import { resolveRemoteBlueprint } from "../catalog/remote.js";
import { assertKnownModules, filterModulesForUi, mergeModuleIds } from "../catalog/stack-modules.js";
import { resolveFromDescription } from "../resolve/from-description.js";
import { buildPlan } from "../plan/build-plan.js";
import { commitPlan, type CommitResult } from "../write/commit.js";
import { finishScaffold } from "../finish/scaffold.js";
import { inspectProject } from "../doctor/inspect.js";
import { pathExists } from "../fsutil.js";

export interface CreateInput {
  name: string;
  cwd?: string;
  targetDir?: string;
  blueprintId?: string;
  description?: string;
  answers?: Partial<CreateAnswers>;
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  skipFinish?: boolean;
  platform?: CreateAnswers["platform"];
  ui?: CreateAnswers["ui"];
  modules?: string[];
  layers?: string[];
  catalogUrl?: string;
  blueprintSource?: string;
  registry?: string;
}

export interface CreateResult {
  plan: GenerationPlan;
  commit: CommitResult;
  finishChanged?: string[];
  doctorOk?: boolean;
}

export async function createProject(input: CreateInput): Promise<CreateResult> {
  const projectName = toPackageName(input.name);
  if (!isValidProjectName(projectName)) {
    throw new MeridianError(MeridianErrorCode.INVALID_PROJECT_NAME, `非法项目名: ${input.name}`);
  }
  const cwd = input.cwd ?? process.cwd();
  const targetDir = resolve(input.targetDir ?? resolve(cwd, projectName));

  const resolution = input.description
    ? resolveFromDescription({
        description: input.description,
        name: projectName,
        platform: input.platform,
        ui: input.ui,
        modules: input.modules,
      })
    : null;

  const blueprintId = input.blueprintId ?? resolution?.blueprintId ?? "headless-workspace";
  const blueprint = await resolveBlueprint(blueprintId, {
    catalogUrl: input.catalogUrl,
    source: input.blueprintSource,
  });

  let answers = CreateAnswersSchema.parse({
    ...blueprint.manifest.defaults,
    ...resolution?.answers,
    ...input.answers,
    ...(input.platform ? { platform: input.platform } : {}),
    ...(input.ui ? { ui: input.ui } : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.registry ? { registry: input.registry } : {}),
  });

  if (input.layers?.includes("adapter")) {
    answers = { ...answers, withAdapter: true };
  }
  if (answers.platform === "pc-desktop") {
    answers = { ...answers, withDesktop: true };
  }

  const modules = filterModulesForUi(mergeModuleIds(answers.modules, input.modules), answers.ui);
  if (modules.length) assertKnownModules(modules);
  answers = { ...answers, modules: modules as UiModuleId[] };

  const plan = await buildPlan({ blueprint, projectName, targetDir, answers });
  const commit = await commitPlan(plan, { force: input.force, dryRun: input.dryRun });

  let finishChanged: string[] | undefined;
  let doctorOk: boolean | undefined;
  const shouldFinish = Boolean(input.description) && !input.skipFinish && !input.dryRun;
  if (shouldFinish) {
    const finished = await finishScaffold(targetDir);
    finishChanged = finished.changed;
  }
  if (!input.dryRun) {
    await writeRegistryNpmrc(targetDir, answers.registry);
    const report = await inspectProject(targetDir);
    doctorOk = report.ok;
  }

  return { plan, commit, finishChanged, doctorOk };
}

async function resolveBlueprint(
  id: string,
  options: { catalogUrl?: string; source?: string },
) {
  try {
    return loadBlueprint(id);
  } catch (error) {
    if (options.source || options.catalogUrl || process.env.MERIDIAN_BLUEPRINT_CATALOG) {
      return resolveRemoteBlueprint({
        blueprintId: id,
        catalogUrl: options.catalogUrl,
        source: options.source,
      });
    }
    throw error;
  }
}

async function writeRegistryNpmrc(targetDir: string, registry: string | undefined): Promise<void> {
  if (!registry) return;
  const file = resolve(targetDir, ".npmrc");
  if (await pathExists(file)) {
    const current = await readFile(file, "utf8");
    if (current.includes("registry=")) return;
    await writeFile(file, `${current.trimEnd()}\nregistry=${registry}\n`, "utf8");
    return;
  }
  await writeFile(file, `registry=${registry}\n`, "utf8");
}
