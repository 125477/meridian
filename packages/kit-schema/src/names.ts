/**
 * npm 包名规则：小写、可含连字符，不以点或下划线开头。
 * 关键决策：与生成物 package.json name 一致，避免后续发布失败。
 */
const NAME_RE = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function isValidProjectName(name: string): boolean {
  if (!name || name.length > 214) return false;
  if (name.startsWith(".") || name.startsWith("_")) return false;
  return NAME_RE.test(name);
}

export function toPackageName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._~/@-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * 仅支持精确版本与 ^x.y.z 范围，避免引入 ISC 许可证的 semver 包。
 */
export function satisfiesCaretRange(version: string, range: string): boolean {
  const parsed = parseTriple(version);
  if (!parsed) return false;
  const trimmed = range.trim();
  if (trimmed === "*" || trimmed === "") return true;
  if (trimmed.startsWith("^")) {
    const min = parseTriple(trimmed.slice(1));
    if (!min) return false;
    if (min.major === 0) {
      if (min.minor === 0) {
        return parsed.major === 0 && parsed.minor === 0 && parsed.patch >= min.patch;
      }
      return parsed.major === 0 && parsed.minor === min.minor && parsed.patch >= min.patch;
    }
    return (
      parsed.major === min.major &&
      (parsed.minor > min.minor || (parsed.minor === min.minor && parsed.patch >= min.patch))
    );
  }
  const exact = parseTriple(trimmed);
  if (!exact) return false;
  return parsed.major === exact.major && parsed.minor === exact.minor && parsed.patch === exact.patch;
}

function parseTriple(input: string): { major: number; minor: number; patch: number } | null {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(input.trim());
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}
