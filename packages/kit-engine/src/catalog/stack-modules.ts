import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";
import { MeridianError, MeridianErrorCode, type UiFramework, type UiModuleId } from "@meridian/schema";
import { getStackModulesPath } from "@meridian/blueprints";

const ModuleDefSchema = z.object({
  label: z.string(),
  keywords: z.array(z.string()).default([]),
  frameworks: z.array(z.enum(["react", "vue"])).optional(),
  dependencies: z.record(z.string()).default({}),
  reactDependencies: z.record(z.string()).optional(),
  vueDependencies: z.record(z.string()).optional(),
});

const StackModulesSchema = z.object({
  version: z.number(),
  modules: z.record(ModuleDefSchema),
});

export type StackModuleDef = z.infer<typeof ModuleDefSchema>;
export type StackModulesConfig = z.infer<typeof StackModulesSchema>;

let cached: StackModulesConfig | null = null;

export function loadStackModules(filePath = getStackModulesPath()): StackModulesConfig {
  if (cached && filePath === getStackModulesPath()) return cached;
  try {
    const parsed = StackModulesSchema.parse(yaml.load(readFileSync(filePath, "utf8")));
    if (filePath === getStackModulesPath()) cached = parsed;
    return parsed;
  } catch (error) {
    throw new MeridianError(MeridianErrorCode.CATALOG_INVALID, `无法加载 stack-modules: ${filePath}`, {
      cause: String(error),
    });
  }
}

export function resetStackModulesCache(): void {
  cached = null;
}

export function listModuleIds(config = loadStackModules()): string[] {
  return Object.keys(config.modules);
}

export function isKnownModule(id: string, config = loadStackModules()): boolean {
  return Boolean(config.modules[id]);
}

export function matchModulesFromDescription(
  description: string,
  config = loadStackModules(),
): UiModuleId[] {
  const haystack = description.toLowerCase();
  const matched: string[] = [];
  for (const [id, def] of Object.entries(config.modules)) {
    if (def.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      matched.push(id);
    }
  }
  return matched as UiModuleId[];
}

export function moduleSupportsUi(
  def: StackModuleDef,
  ui: UiFramework,
): boolean {
  if (def.frameworks && def.frameworks.length > 0) {
    return def.frameworks.includes(ui);
  }
  const shared = Object.keys(def.dependencies).length > 0;
  if (ui === "vue") {
    return shared || Boolean(def.vueDependencies && Object.keys(def.vueDependencies).length);
  }
  return shared || Boolean(def.reactDependencies && Object.keys(def.reactDependencies).length);
}

export function filterModulesForUi(
  moduleIds: string[],
  ui: UiFramework,
  config = loadStackModules(),
): string[] {
  return moduleIds.filter((id) => {
    const def = config.modules[id];
    if (!def) return false;
    return moduleSupportsUi(def, ui);
  });
}

export function collectModuleDependencies(
  moduleIds: string[],
  ui: UiFramework,
  config = loadStackModules(),
): Record<string, string> {
  const deps: Record<string, string> = {};
  for (const id of filterModulesForUi(moduleIds, ui, config)) {
    const def = config.modules[id];
    if (!def) continue;
    Object.assign(deps, def.dependencies);
    if (ui === "react") Object.assign(deps, def.reactDependencies ?? {});
    if (ui === "vue") Object.assign(deps, def.vueDependencies ?? {});
  }
  return deps;
}

export function mergeModuleIds(...sources: Array<string[] | undefined>): string[] {
  return [...new Set(sources.flatMap((items) => items ?? []).filter(Boolean))];
}

export function assertKnownModules(moduleIds: string[], config = loadStackModules()): void {
  const unknown = moduleIds.filter((id) => !isKnownModule(id, config));
  if (unknown.length > 0) {
    throw new MeridianError(
      MeridianErrorCode.MODULE_UNKNOWN,
      `未知 UI 模块: ${unknown.join(", ")}。可用: ${listModuleIds(config).join(", ")}`,
    );
  }
}
