import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const IGNORE = new Set(["node_modules", ".git", ".meridian-journal.json", ".DS_Store"]);

export interface GoldenDiff {
  ok: boolean;
  missing: string[];
  extra: string[];
  changed: string[];
}

export async function diffGolden(actualDir: string, goldenDir: string): Promise<GoldenDiff> {
  const actual = await listFiles(actualDir);
  const golden = await listFiles(goldenDir);
  const missing = [...golden].filter((f) => !actual.has(f)).sort();
  const extra = [...actual].filter((f) => !golden.has(f) && f !== ".meridian/project.json").sort();
  const changed: string[] = [];
  for (const file of golden) {
    if (!actual.has(file)) continue;
    if (file === ".meridian/project.json") continue;
    const a = await readFile(join(actualDir, file), "utf8");
    const b = await readFile(join(goldenDir, file), "utf8");
    if (normalize(a) !== normalize(b)) changed.push(file);
  }
  return {
    ok: missing.length === 0 && extra.length === 0 && changed.length === 0,
    missing,
    extra,
    changed,
  };
}

export function formatGoldenDiff(id: string, diff: GoldenDiff): string {
  if (diff.ok) return `✔ ${id} matches golden`;
  const lines = [`✖ ${id} golden diff`];
  if (diff.missing.length) lines.push(`  missing: ${diff.missing.join(", ")}`);
  if (diff.extra.length) lines.push(`  extra: ${diff.extra.join(", ")}`);
  if (diff.changed.length) lines.push(`  changed: ${diff.changed.join(", ")}`);
  return lines.join("\n");
}

function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

async function listFiles(root: string): Promise<Set<string>> {
  const out = new Set<string>();
  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) out.add(relative(root, full).split("\\").join("/"));
    }
  }
  try {
    await stat(root);
  } catch {
    return out;
  }
  await walk(root);
  return out;
}
