import type { Command } from "commander";
import {
  formatCatalogText,
  formatMappingSection,
  formatTechnicalProposal,
  listCapabilityCatalog,
  mergeAnswers,
  resolveFromDescription,
  runLlmSelection,
} from "@meridian/engine";

export function registerResolve(program: Command): void {
  program
    .command("resolve")
    .description("根据描述推荐蓝图，不写盘")
    .option("--describe <text>", "项目描述")
    .option("--name <name>", "项目名（仅用于展示命令）")
    .option("--platform <target>", "pc-web | h5 | pc-desktop")
    .option("--catalog", "打印能力目录", false)
    .option("--mapping", "只输出 §4 映射段落", false)
    .option("--llm", "额外调用 OpenAI 兼容接口", false)
    .option("--context <text>", "LLM 补充上下文")
    .option("--json", "JSON 输出", false)
    .action(async (opts) => {
      if (opts.catalog) {
        const catalog = listCapabilityCatalog();
        if (opts.json) {
          console.log(JSON.stringify(catalog, null, 2));
          return;
        }
        console.log(formatCatalogText(catalog));
        return;
      }
      if (!opts.describe) {
        console.error("resolve 需要 --describe 或 --catalog");
        process.exitCode = 1;
        return;
      }
      const matrix = resolveFromDescription({
        description: String(opts.describe),
        name: opts.name,
        platform: opts.platform,
      });
      let merged = matrix;
      let llmNarrative: string | undefined;
      if (opts.llm) {
        const llm = await runLlmSelection({
          description: String(opts.describe),
          extraContext: opts.context,
        });
        llmNarrative = llm.narrative;
        if (llm.answers) {
          const answers = mergeAnswers({
            matrix: matrix.answers,
            llm: llm.answers,
            userPlatform: opts.platform,
          });
          merged = { ...matrix, answers };
        }
      }
      const name = opts.name ?? "my-app";
      if (opts.json) {
        console.log(JSON.stringify({ matrix, merged, llmNarrative }, null, 2));
        return;
      }
      if (opts.mapping) {
        console.log(formatMappingSection(merged, name));
        return;
      }
      console.log(
        formatTechnicalProposal({
          projectName: name,
          description: String(opts.describe),
          resolution: merged,
          llmNarrative,
        }),
      );
    });
}
