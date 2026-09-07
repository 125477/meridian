import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  BlueprintManifestSchema,
  MeridianError,
  MeridianErrorCode,
  satisfiesCaretRange,
  type BlueprintManifest,
} from "@meridian/schema";
import { getBlueprintsRoot } from "@meridian/blueprints";
import { KIT_VERSION } from "../constants.js";
import { pathExists } from "../fsutil.js";

export interface LoadedBlueprint {
  manifest: BlueprintManifest;
  rootDir: string;
  templateDir: string;
}

export function listLocalBlueprints(root = getBlueprintsRoot()): LoadedBlueprint[] {
  const entries = readdirSync(root, { withFileTypes: true });
  const loaded: LoadedBlueprint[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    const manifestPath = join(dir, "blueprint.json");
    try {
      statSync(manifestPath);
      loaded.push(loadBlueprintFromDir(dir));
    } catch {
      continue;
    }
  }
  return loaded.sort((a, b) => a.manifest.id.localeCompare(b.manifest.id));
}

export function loadBlueprint(id: string, root = getBlueprintsRoot()): LoadedBlueprint {
  const local = listLocalBlueprints(root).find((item) => item.manifest.id === id);
  if (local) return local;
  throw new MeridianError(MeridianErrorCode.BLUEPRINT_NOT_FOUND, `未找到蓝图: ${id}`, { id });
}

export function loadBlueprintFromDir(dir: string): LoadedBlueprint {
  const manifestPath = join(dir, "blueprint.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new MeridianError(MeridianErrorCode.BLUEPRINT_INVALID, `无法读取 blueprint.json: ${manifestPath}`, {
      cause: String(error),
    });
  }
  const result = BlueprintManifestSchema.safeParse(parsed);
  if (!result.success) {
    throw new MeridianError(MeridianErrorCode.BLUEPRINT_INVALID, `蓝图清单校验失败: ${dir}`, {
      issues: result.error.issues,
    });
  }
  if (!satisfiesCaretRange(KIT_VERSION, result.data.kitVersion)) {
    throw new MeridianError(
      MeridianErrorCode.BLUEPRINT_INCOMPATIBLE,
      `蓝图 ${result.data.id}@${result.data.version} 需要 kitVersion ${result.data.kitVersion}，当前 ${KIT_VERSION}`,
    );
  }
  const templateDir = join(dir, result.data.templateDir);
  if (!pathExistsSync(templateDir)) {
    throw new MeridianError(MeridianErrorCode.TEMPLATE_MISSING, `模板目录不存在: ${templateDir}`);
  }
  return { manifest: result.data, rootDir: dir, templateDir };
}

function pathExistsSync(target: string): boolean {
  try {
    statSync(target);
    return true;
  } catch {
    return false;
  }
}

export async function assertTemplateDir(dir: string): Promise<void> {
  if (!(await pathExists(dir))) {
    throw new MeridianError(MeridianErrorCode.TEMPLATE_MISSING, `模板目录不存在: ${dir}`);
  }
}
