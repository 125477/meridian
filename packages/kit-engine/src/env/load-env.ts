import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 读取 cwd 下 .env / .env.local，不覆盖已有 process.env。
 */
export function loadEnvFile(dir = process.cwd()): void {
  for (const name of [".env", ".env.local"]) {
    const file = join(dir, name);
    let raw: string;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}
