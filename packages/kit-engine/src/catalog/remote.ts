import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { mkdir, writeFile, cp, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import {
  MeridianError,
  MeridianErrorCode,
  RemoteCatalogSchema,
  type RemoteCatalog,
} from "@meridian/schema";
import { ensureDir } from "../fsutil.js";
import { loadBlueprintFromDir, type LoadedBlueprint } from "./blueprints.js";

export function defaultCacheDir(): string {
  return process.env.MERIDIAN_CACHE_DIR ?? join(homedir(), ".cache", "meridian");
}

export async function loadRemoteCatalog(
  catalogUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RemoteCatalog> {
  let res: Response;
  try {
    res = await fetchImpl(catalogUrl);
  } catch (error) {
    throw new MeridianError(MeridianErrorCode.CATALOG_UNREACHABLE, `无法请求蓝图目录: ${catalogUrl}`, {
      cause: String(error),
    });
  }
  if (!res.ok) {
    throw new MeridianError(
      MeridianErrorCode.CATALOG_UNREACHABLE,
      `蓝图目录请求失败: ${catalogUrl} (${res.status})`,
    );
  }
  const raw = (await res.json()) as Record<string, unknown>;
  if (!Array.isArray(raw.blueprints) && !Array.isArray(raw.presets)) {
    throw new MeridianError(MeridianErrorCode.CATALOG_INVALID, `远程蓝图目录格式无效: ${catalogUrl}`);
  }
  const normalized = {
    version: raw.version ?? 1,
    blueprints: raw.blueprints ?? raw.presets ?? [],
  };
  const parsed = RemoteCatalogSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new MeridianError(MeridianErrorCode.CATALOG_INVALID, `远程蓝图目录格式无效: ${catalogUrl}`);
  }
  return parsed.data;
}

export async function resolveRemoteBlueprint(options: {
  blueprintId: string;
  catalogUrl?: string;
  source?: string;
  cacheDir?: string;
}): Promise<LoadedBlueprint> {
  const cacheDir = options.cacheDir ?? defaultCacheDir();
  const source =
    options.source ??
    (await lookupCatalogSource(options.blueprintId, options.catalogUrl ?? process.env.MERIDIAN_BLUEPRINT_CATALOG));

  const dest = join(cacheDir, "blueprints", options.blueprintId);
  await ensureDir(dirname(dest));
  const unpacked = await materializeSource(source, dest);
  return loadBlueprintFromDir(unpacked);
}

async function lookupCatalogSource(blueprintId: string, catalogUrl: string | undefined): Promise<string> {
  if (!catalogUrl) {
    throw new MeridianError(
      MeridianErrorCode.CATALOG_UNREACHABLE,
      `远程蓝图 "${blueprintId}" 需要 --catalog 或环境变量 MERIDIAN_BLUEPRINT_CATALOG`,
    );
  }
  const catalog = await loadRemoteCatalog(catalogUrl);
  const entry = catalog.blueprints.find((item) => item.id === blueprintId);
  if (!entry) {
    throw new MeridianError(
      MeridianErrorCode.BLUEPRINT_NOT_FOUND,
      `远程目录中没有蓝图 "${blueprintId}"。已知: ${catalog.blueprints.map((b) => b.id).join(", ")}`,
    );
  }
  const source =
    entry.source ?? (entry.package ? `npm:${entry.package}${entry.version ? `@${entry.version}` : ""}` : undefined);
  if (!source) {
    throw new MeridianError(MeridianErrorCode.CATALOG_INVALID, `目录条目 "${blueprintId}" 缺少 source 或 package`);
  }
  return source;
}

async function materializeSource(source: string, dest: string): Promise<string> {
  if (source.startsWith("file:")) {
    const from = source.slice("file:".length);
    await cp(from, dest, { recursive: true, force: true });
    return dest;
  }
  if (source.startsWith("/") || source.startsWith(".")) {
    await cp(source, dest, { recursive: true, force: true });
    return dest;
  }
  if (source.startsWith("github:")) {
    return downloadGithub(source, dest);
  }
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return downloadTarball(source, dest);
  }
  throw new MeridianError(
    MeridianErrorCode.CATALOG_INVALID,
    `不支持的蓝图源: ${source}（可用 github:org/repo/path#ref、file:、https://tarball）`,
  );
}

async function downloadGithub(source: string, dest: string): Promise<string> {
  const match = /^github:([^/]+)\/([^/#]+)(?:\/([^#]*))?(?:#(.+))?$/.exec(source);
  if (!match) {
    throw new MeridianError(MeridianErrorCode.CATALOG_INVALID, `无法解析 github 源: ${source}`);
  }
  const [, org, repo, subpath, ref] = match;
  const tarball = `https://codeload.github.com/${org}/${repo}/tar.gz/${ref ?? "HEAD"}`;
  const extracted = await downloadTarball(tarball, dest);
  const inner = subpath ? join(extracted, subpath) : extracted;
  try {
    await access(inner);
  } catch {
    throw new MeridianError(MeridianErrorCode.TEMPLATE_MISSING, `解压后未找到路径: ${inner}`);
  }
  return inner;
}

async function downloadTarball(url: string, dest: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new MeridianError(MeridianErrorCode.CATALOG_UNREACHABLE, `下载失败: ${url} (${res.status})`);
  }
  await mkdir(dest, { recursive: true });
  const archive = join(dest, ".download.tgz");
  await writeFile(archive, Buffer.from(await res.arrayBuffer()));
  const result = spawnSync("tar", ["-xzf", archive, "-C", dest, "--strip-components=1"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new MeridianError(MeridianErrorCode.WRITE_FAILED, `解压失败: ${result.stderr || result.stdout}`);
  }
  return dest;
}
