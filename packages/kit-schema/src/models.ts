import { z } from "zod";

/** 工作区分层：无头业务 / 展示 / 适配 / 应用接线 */
export const LayerIdSchema = z.enum(["engine", "ui", "adapter", "apps"]);
export type LayerId = z.infer<typeof LayerIdSchema>;

export const UiFrameworkSchema = z.enum(["react", "vue"]);
export type UiFramework = z.infer<typeof UiFrameworkSchema>;

export const PlatformSchema = z.enum(["pc-web", "h5", "pc-desktop"]);
export type Platform = z.infer<typeof PlatformSchema>;

export const PackageManagerSchema = z.enum(["pnpm", "npm", "yarn"]);
export type PackageManager = z.infer<typeof PackageManagerSchema>;

export const FeatureIdSchema = z.enum([
  "storybook",
  "docs",
  "adapter",
  "i18n",
  "themes",
  "optimize",
  "desktop",
]);
export type FeatureId = z.infer<typeof FeatureIdSchema>;

export const UiModuleIdSchema = z.enum([
  "rich-text",
  "emoji",
  "file-preview",
  "markdown",
  "virtual-list",
  "command-palette",
  "hooks",
  "screenshot",
  "pinyin",
]);
export type UiModuleId = z.infer<typeof UiModuleIdSchema>;

const WhenEqualsSchema = z.object({
  equals: z.tuple([z.string(), z.union([z.string(), z.boolean(), z.number()])]),
});

export const PathRuleSchema = z.object({
  pattern: z.string().min(1),
  when: WhenEqualsSchema,
});

export const RenameRuleSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  when: WhenEqualsSchema,
});

export const PromptChoiceSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const PromptDefinitionSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["select", "confirm", "text"]),
  message: z.string(),
  choices: z.array(PromptChoiceSchema).optional(),
  default: z.union([z.string(), z.boolean()]).optional(),
});

export const BlueprintFeatureSchema = z.object({
  apps: z.array(z.string()).optional(),
  layers: z.array(LayerIdSchema).optional(),
  requires: z.array(z.string()).optional(),
});

export const BlueprintManifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  version: z.string().min(1),
  kitVersion: z.string().min(1),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  layers: z.array(LayerIdSchema).min(1),
  defaultApps: z.array(z.string()).default([]),
  optionalApps: z.array(z.string()).default([]),
  defaults: z.record(z.unknown()),
  prompts: z.array(PromptDefinitionSchema).default([]),
  features: z.record(BlueprintFeatureSchema).default({}),
  templateDir: z.string().min(1),
  pathRules: z.array(PathRuleSchema).default([]),
  renameRules: z.array(RenameRuleSchema).default([]),
  license: z.string().default("MIT"),
});

export type BlueprintManifest = z.infer<typeof BlueprintManifestSchema>;

export const CreateAnswersSchema = z.object({
  ui: UiFrameworkSchema.default("react"),
  platform: PlatformSchema.default("pc-web"),
  packageManager: PackageManagerSchema.default("pnpm"),
  withStorybook: z.boolean().default(false),
  withDocs: z.boolean().default(false),
  withAdapter: z.boolean().default(false),
  withI18n: z.boolean().default(false),
  withThemes: z.boolean().default(false),
  withOptimize: z.boolean().default(true),
  withDesktop: z.boolean().default(false),
  modules: z.array(UiModuleIdSchema).default([]),
  description: z.string().optional(),
  registry: z.string().optional(),
});

export type CreateAnswers = z.infer<typeof CreateAnswersSchema>;

export const ResolutionSchema = z.object({
  blueprintId: z.string(),
  kindId: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  score: z.number(),
  reasons: z.array(z.string()),
  answers: CreateAnswersSchema,
  warnings: z.array(z.string()).default([]),
});

export type Resolution = z.infer<typeof ResolutionSchema>;

export const PlannedFileSchema = z.object({
  relativePath: z.string(),
  kind: z.enum(["copy", "render"]),
  sourcePath: z.string(),
});

export type PlannedFile = z.infer<typeof PlannedFileSchema>;

export const GenerationPlanSchema = z.object({
  kitVersion: z.string(),
  blueprintId: z.string(),
  blueprintVersion: z.string(),
  projectName: z.string(),
  targetDir: z.string(),
  answers: CreateAnswersSchema,
  layers: z.array(LayerIdSchema),
  apps: z.array(z.string()),
  features: z.array(z.string()),
  files: z.array(PlannedFileSchema),
  createdAt: z.string(),
});

export type GenerationPlan = z.infer<typeof GenerationPlanSchema>;

export const ProjectMetaSchema = z.object({
  kitVersion: z.string(),
  blueprintId: z.string(),
  blueprintVersion: z.string(),
  createdAt: z.string(),
  answers: CreateAnswersSchema,
  layers: z.array(LayerIdSchema),
  apps: z.array(z.string()),
  features: z.array(z.string()),
  description: z.string().optional(),
});

export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

export const DoctorFindingSchema = z.object({
  id: z.string(),
  level: z.enum(["error", "warn", "info"]),
  message: z.string(),
  path: z.string().optional(),
});

export type DoctorFinding = z.infer<typeof DoctorFindingSchema>;

export const DoctorReportSchema = z.object({
  ok: z.boolean(),
  findings: z.array(DoctorFindingSchema),
});

export type DoctorReport = z.infer<typeof DoctorReportSchema>;

export const RemoteCatalogEntrySchema = z.object({
  id: z.string(),
  source: z.string().optional(),
  package: z.string().optional(),
  version: z.string().optional(),
});

export const RemoteCatalogSchema = z.object({
  version: z.number(),
  blueprints: z.array(RemoteCatalogEntrySchema),
});

export type RemoteCatalog = z.infer<typeof RemoteCatalogSchema>;
