import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * 从 Skill 目录或 monorepo 包中加载同一套引擎，避免 CLI / Agent 分叉实现。
 */
export async function loadEngine() {
  const here = dirname(fileURLToPath(import.meta.url));
  const kitHome = readKitHome(here);
  const candidates = [
    process.env.MERIDIAN_HOME
      ? join(process.env.MERIDIAN_HOME, "packages/kit-engine/dist/index.js")
      : null,
    kitHome ? join(kitHome, "packages/kit-engine/dist/index.js") : null,
    join(here, "../../kit-engine/dist/index.js"),
    join(here, "../vendor/node_modules/@meridian/engine/dist/index.js"),
    join(here, "../vendor/kit-engine/index.js"),
  ].filter(Boolean);

  for (const file of candidates) {
    if (file && existsSync(file)) {
      return import(pathToFileURL(file).href);
    }
  }

  try {
    const require = createRequire(import.meta.url);
    const resolved = require.resolve("@meridian/engine");
    return import(pathToFileURL(resolved).href);
  } catch {
    throw new Error(
      "找不到 @meridian/engine。请在 meridian 仓库执行 pnpm build，或设置 MERIDIAN_HOME。",
    );
  }
}

function readKitHome(scriptsDir) {
  const file = join(scriptsDir, "../kit-home.json");
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return parsed.home ?? null;
  } catch {
    return null;
  }
}

export function parseArgs(argv) {
  const args = [...argv];
  const flags = {};
  const positional = [];
  while (args.length) {
    const token = args.shift();
    if (!token) break;
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = args[0];
      if (!next || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = args.shift();
      }
    } else {
      positional.push(token);
    }
  }
  return { flags, positional };
}
