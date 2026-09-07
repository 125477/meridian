import * as clack from "@clack/prompts";
import type { BlueprintManifest, CreateAnswers } from "@meridian/schema";
import { MeridianError, MeridianErrorCode } from "@meridian/schema";

export async function runBlueprintPrompts(
  manifest: BlueprintManifest,
  current: Partial<CreateAnswers>,
): Promise<Partial<CreateAnswers>> {
  const next: Partial<CreateAnswers> = { ...current };
  for (const prompt of manifest.prompts) {
    if (prompt.type === "select") {
      const picked = await clack.select({
        message: prompt.message,
        initialValue: String((next as Record<string, unknown>)[prompt.key] ?? prompt.default ?? ""),
        options: (prompt.choices ?? []).map((choice) => ({ value: choice.value, label: choice.label })),
      });
      if (clack.isCancel(picked)) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
      (next as Record<string, unknown>)[prompt.key] = picked;
    } else if (prompt.type === "confirm") {
      const picked = await clack.confirm({
        message: prompt.message,
        initialValue: Boolean((next as Record<string, unknown>)[prompt.key] ?? prompt.default ?? false),
      });
      if (clack.isCancel(picked)) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
      (next as Record<string, unknown>)[prompt.key] = picked;
    } else {
      const typed = await clack.text({
        message: prompt.message,
        initialValue: String((next as Record<string, unknown>)[prompt.key] ?? prompt.default ?? ""),
      });
      if (clack.isCancel(typed)) throw new MeridianError(MeridianErrorCode.USER_CANCELLED, "已取消");
      (next as Record<string, unknown>)[prompt.key] = typed;
    }
  }
  return next;
}
