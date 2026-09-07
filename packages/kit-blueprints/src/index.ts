import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** 编译后 dist/index.js 上溯到包根 */
export function getPackageRoot(): string {
  return join(here, "..");
}

export function getBlueprintsRoot(): string {
  if (process.env.MERIDIAN_BLUEPRINTS_ROOT) return process.env.MERIDIAN_BLUEPRINTS_ROOT;
  return join(getPackageRoot(), "blueprints");
}

export function getCatalogRoot(): string {
  if (process.env.MERIDIAN_CATALOG_ROOT) return process.env.MERIDIAN_CATALOG_ROOT;
  return join(getPackageRoot(), "catalog");
}

export function getStackModulesPath(): string {
  return join(getCatalogRoot(), "stack-modules.yaml");
}
