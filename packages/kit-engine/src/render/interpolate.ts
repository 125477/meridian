/**
 * 受限模板插值器。
 * 只支持路径取值、{{#if}} / {{#unless}} / {{#each}}，不执行任意 JavaScript。
 * 关键决策：避免 EJS 一类可执行模板带来的注入面。
 */
export function interpolate(source: string, context: Record<string, unknown>): string {
  let output = expandEach(source, context);
  output = expandConditionals(output, context);
  output = expandValues(output, context);
  return output;
}

function expandEach(source: string, context: Record<string, unknown>): string {
  const re = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  return source.replace(re, (_all, path: string, body: string) => {
    const value = lookup(context, path);
    const items = Array.isArray(value) ? value : [];
    return items
      .map((item, index) => {
        const child: Record<string, unknown> = {
          ...context,
          this: item,
          index,
        };
        if (item && typeof item === "object") {
          Object.assign(child, item as Record<string, unknown>);
        }
        return interpolate(body, child);
      })
      .join("");
  });
}

function expandConditionals(source: string, context: Record<string, unknown>): string {
  const re = /\{\{#(if|unless)\s+([\w.]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  return source.replace(re, (_all, kind: string, path: string, body: string) => {
    const truthy = isTruthy(lookup(context, path));
    const show = kind === "if" ? truthy : !truthy;
    const parts = body.split(/\{\{else\}\}/);
    const positive = parts[0] ?? "";
    const negative = parts[1] ?? "";
    const chosen = show ? positive : negative;
    return interpolate(chosen, context);
  });
}

function expandValues(source: string, context: Record<string, unknown>): string {
  return source.replace(/\{\{([\w.]+)\}\}/g, (_all, path: string) => {
    const value = lookup(context, path);
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return JSON.stringify(value);
  });
}

export function lookup(context: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = context;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function isTruthy(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}
