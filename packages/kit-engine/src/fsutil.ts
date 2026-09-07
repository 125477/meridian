import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

export async function pathExists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  if (!(await pathExists(dir))) return true;
  const entries = await readdir(dir);
  return entries.filter((name) => name !== ".git" && name !== ".DS_Store").length === 0;
}

export async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        await walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(root);
  return out;
}

export function toPosix(pathValue: string): string {
  return pathValue.split(sep).join("/");
}

export function relativePosix(from: string, to: string): string {
  return toPosix(relative(from, to));
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, content, "utf8");
}

export async function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function removePath(target: string): Promise<void> {
  await rm(target, { recursive: true, force: true });
}

export function matchGlob(relativePath: string, pattern: string): boolean {
  const normalized = toPosix(relativePath);
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  }
  if (pattern.includes("*")) {
    const re = new RegExp(
      `^${pattern
        .split("*")
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`,
    );
    return re.test(normalized);
  }
  return normalized === pattern;
}
