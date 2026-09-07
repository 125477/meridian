import { join } from "node:path";
import { readFile } from "node:fs/promises";
import {
  MeridianError,
  MeridianErrorCode,
  ProjectMetaSchema,
  type DoctorFinding,
  type DoctorReport,
  type ProjectMeta,
} from "@meridian/schema";
import { pathExists, readTextFile } from "../fsutil.js";
import { metaPath } from "../plan/build-plan.js";

export async function readProjectMeta(projectDir: string): Promise<ProjectMeta> {
  const file = metaPath(projectDir);
  if (!(await pathExists(file))) {
    throw new MeridianError(MeridianErrorCode.PROJECT_META_MISSING, `未找到 ${file}。该目录不是 Meridian 生成的项目。`);
  }
  const raw = await readTextFile(file);
  return ProjectMetaSchema.parse(JSON.parse(raw));
}

export async function inspectProject(projectDir: string): Promise<DoctorReport> {
  const findings: DoctorFinding[] = [];
  const workspace = join(projectDir, "pnpm-workspace.yaml");
  if (!(await pathExists(workspace))) {
    findings.push({
      id: "workspace-missing",
      level: "error",
      message: "缺少 pnpm-workspace.yaml",
      path: "pnpm-workspace.yaml",
    });
  }
  if (!(await pathExists(join(projectDir, "package.json")))) {
    findings.push({
      id: "root-package-missing",
      level: "error",
      message: "缺少根 package.json",
      path: "package.json",
    });
  }
  if (!(await pathExists(join(projectDir, "AGENTS.md")))) {
    findings.push({
      id: "agents-missing",
      level: "warn",
      message: "缺少 AGENTS.md，Agent 将缺少项目约定",
      path: "AGENTS.md",
    });
  }
  if (!(await pathExists(join(projectDir, ".cursor/rules")))) {
    findings.push({
      id: "rules-missing",
      level: "warn",
      message: "缺少 .cursor/rules/",
      path: ".cursor/rules",
    });
  }

  let meta: ProjectMeta | null = null;
  try {
    meta = await readProjectMeta(projectDir);
  } catch {
    findings.push({
      id: "meta-missing",
      level: "error",
      message: "缺少 .meridian/project.json",
      path: ".meridian/project.json",
    });
  }

  if (meta) {
    await checkLayerDeps(projectDir, meta, findings);
    if (meta.layers.includes("engine") && !(await pathExists(join(projectDir, "packages/engine/package.json")))) {
      findings.push({
        id: "engine-missing",
        level: "error",
        message: "已声明 engine 层，但 packages/engine 不存在",
        path: "packages/engine",
      });
    }
    if (meta.layers.includes("ui") && !(await pathExists(join(projectDir, "packages/ui/package.json")))) {
      findings.push({
        id: "ui-missing",
        level: "error",
        message: "已声明 ui 层，但 packages/ui 不存在",
        path: "packages/ui",
      });
    }
    if (meta.features.includes("desktop") && !(await pathExists(join(projectDir, "apps/electron/package.json")))) {
      findings.push({
        id: "electron-missing",
        level: "error",
        message: "已启用 desktop，但 apps/electron 不存在",
        path: "apps/electron",
      });
    }
    if (meta.features.includes("i18n") && !(await pathExists(join(projectDir, "packages/ui/src/i18n")))) {
      findings.push({
        id: "i18n-missing",
        level: "warn",
        message: "已启用 i18n，但 packages/ui/src/i18n 不存在",
        path: "packages/ui/src/i18n",
      });
    }
  }

  const pkgPath = join(projectDir, "package.json");
  if (await pathExists(pkgPath)) {
    try {
      const pkg = JSON.parse(await readFile(pkgPath, "utf8")) as { scripts?: Record<string, string> };
      if (!pkg.scripts?.build) {
        findings.push({
          id: "build-script-missing",
          level: "warn",
          message: "根 package.json 没有 build 脚本",
          path: "package.json",
        });
      }
    } catch {
      findings.push({
        id: "root-package-invalid",
        level: "error",
        message: "根 package.json 不是合法 JSON",
        path: "package.json",
      });
    }
  }

  const ok = findings.every((item) => item.level !== "error");
  return { ok, findings };
}

async function checkLayerDeps(projectDir: string, meta: ProjectMeta, findings: DoctorFinding[]): Promise<void> {
  const enginePkg = join(projectDir, "packages/engine/package.json");
  const uiPkg = join(projectDir, "packages/ui/package.json");
  if (await pathExists(enginePkg)) {
    const json = JSON.parse(await readFile(enginePkg, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const deps = Object.keys(json.dependencies ?? {});
    if (deps.some((name) => name.endsWith("/ui") || name.includes("packages/ui"))) {
      findings.push({
        id: "engine-depends-ui",
        level: "error",
        message: "engine 不得依赖 ui（依赖方向必须是 adapter → engine → ui → apps）",
        path: "packages/engine/package.json",
      });
    }
  }
  if (await pathExists(uiPkg) && meta.layers.includes("engine")) {
    const json = JSON.parse(await readFile(uiPkg, "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const deps = Object.keys(json.dependencies ?? {});
    if (deps.some((name) => name.endsWith("/web") || name.includes("apps/web"))) {
      findings.push({
        id: "ui-depends-app",
        level: "error",
        message: "ui 不得依赖 apps（页面接线应放在 apps/web）",
        path: "packages/ui/package.json",
      });
    }
  }
}
