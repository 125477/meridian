import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";
import { MeridianError, MeridianErrorCode } from "@meridian/schema";
import { getCatalogRoot } from "@meridian/blueprints";

const CueSchema = z.object({
  id: z.string(),
  keywords: z.array(z.string()),
  weight: z.number().default(8),
  apply: z.record(z.unknown()).default({}),
});

const KindSchema = z.object({
  id: z.string(),
  title: z.string(),
  keywords: z.array(z.string()),
  weight: z.number(),
  blueprint: z.string(),
  answers: z.record(z.unknown()).default({}),
  requiredCues: z.array(z.string()).default([]),
  conflicts: z.array(z.string()).default([]),
});

const ConstraintSchema = z.object({
  when: z.record(z.unknown()),
  require: z.record(z.unknown()),
});

const StackMapSchema = z.object({
  version: z.number(),
  kinds: z.array(KindSchema),
  cues: z.array(CueSchema),
  constraints: z.array(ConstraintSchema).default([]),
});

export type StackMap = z.infer<typeof StackMapSchema>;
export type KindDef = z.infer<typeof KindSchema>;
export type CueDef = z.infer<typeof CueSchema>;

let cached: StackMap | null = null;

export function loadStackMap(catalogDir = getCatalogRoot()): StackMap {
  if (cached) return cached;
  const filePath = join(catalogDir, "stack-map.yaml");
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = yaml.load(raw);
    cached = StackMapSchema.parse(parsed);
    return cached;
  } catch (error) {
    throw new MeridianError(MeridianErrorCode.CATALOG_INVALID, `无法加载 stack-map: ${filePath}`, {
      cause: String(error),
    });
  }
}

export function resetStackMapCache(): void {
  cached = null;
}

/** 测试或自定义 catalog 时使用 */
export function loadStackMapFromDir(dir: string): StackMap {
  const filePath = join(dir, "stack-map.yaml");
  const raw = readFileSync(filePath, "utf8");
  return StackMapSchema.parse(yaml.load(raw));
}

export function stackMapDirFromUrl(metaUrl: string): string {
  return join(dirname(fileURLToPath(metaUrl)), "../../catalog");
}
