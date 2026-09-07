import { copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { MeridianError, MeridianErrorCode, type GenerationPlan, type ProjectMeta } from "@meridian/schema";
import { JOURNAL_FILE } from "../constants.js";
import { ensureDir, isDirectoryEmpty, pathExists, removePath, writeTextFile } from "../fsutil.js";
import { interpolate } from "../render/interpolate.js";
import { readFile } from "node:fs/promises";
import { metaPath, templateContext } from "../plan/build-plan.js";

export interface CommitOptions {
  force?: boolean;
  dryRun?: boolean;
  skipExisting?: boolean;
}

export interface CommitResult {
  written: string[];
  skipped: string[];
  dryRun: boolean;
}

interface Journal {
  files: string[];
}

export async function commitPlan(plan: GenerationPlan, options: CommitOptions = {}): Promise<CommitResult> {
  const written: string[] = [];
  const skipped: string[] = [];
  const targetDir = plan.targetDir;

  if (options.dryRun) {
    return { written: plan.files.map((f) => f.relativePath), skipped: [], dryRun: true };
  }

  const exists = await pathExists(targetDir);
  if (exists && !(await isDirectoryEmpty(targetDir)) && !options.force && !options.skipExisting) {
    throw new MeridianError(MeridianErrorCode.TARGET_NOT_EMPTY, `目标目录非空: ${targetDir}。使用 --force 覆盖，或换一个目录。`, {
      targetDir,
    });
  }
  await ensureDir(targetDir);

  const journal: Journal = { files: [] };
  const journalPath = join(targetDir, JOURNAL_FILE);
  const context = templateContext(plan);

  try {
    for (const file of plan.files) {
      const dest = join(targetDir, file.relativePath);
      if (options.skipExisting && (await pathExists(dest))) {
        skipped.push(file.relativePath);
        continue;
      }
      await ensureDir(dirname(dest));
      if (file.kind === "copy") {
        await copyFile(file.sourcePath, dest);
      } else {
        const source = await readFile(file.sourcePath, "utf8");
        let rendered: string;
        try {
          rendered = interpolate(source, context);
        } catch (error) {
          throw new MeridianError(MeridianErrorCode.RENDER_FAILED, `渲染失败: ${file.relativePath}`, {
            cause: String(error),
          });
        }
        if (/\{\{#if|\{\{#each|\{\{#unless/.test(rendered)) {
          throw new MeridianError(MeridianErrorCode.RENDER_FAILED, `模板未完全展开: ${file.relativePath}`);
        }
        await writeTextFile(dest, rendered);
      }
      journal.files.push(file.relativePath);
      written.push(file.relativePath);
    }

    const meta: ProjectMeta = {
      kitVersion: plan.kitVersion,
      blueprintId: plan.blueprintId,
      blueprintVersion: plan.blueprintVersion,
      createdAt: plan.createdAt,
      answers: plan.answers,
      layers: plan.layers,
      apps: plan.apps,
      features: plan.features,
      description: plan.answers.description,
    };
    const metaFile = metaPath(targetDir);
    await writeTextFile(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
    written.push(".meridian/project.json");
    await removePath(journalPath);
    return { written, skipped, dryRun: false };
  } catch (error) {
    await rollback(targetDir, journal.files);
    if (error instanceof MeridianError) throw error;
    throw new MeridianError(MeridianErrorCode.WRITE_FAILED, `写盘失败: ${String(error)}`);
  }
}

async function rollback(targetDir: string, files: string[]): Promise<void> {
  for (const rel of [...files].reverse()) {
    await removePath(join(targetDir, rel));
  }
}
