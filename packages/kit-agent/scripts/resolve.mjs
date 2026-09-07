#!/usr/bin/env node
import { loadEngine, parseArgs } from "./lib.mjs";

const { flags } = parseArgs(process.argv.slice(2));
const engine = await loadEngine();

if (flags.catalog && !flags.describe) {
  const catalog = engine.listCapabilityCatalog();
  console.log(engine.formatCatalogText(catalog));
  process.exit(0);
}

if (!flags.describe) {
  console.error("用法: node resolve.mjs --describe \"...\" [--mapping] [--llm] [--name app] [--platform pc-web]");
  process.exit(1);
}

const resolution = engine.resolveFromDescription({
  description: String(flags.describe),
  name: flags.name ? String(flags.name) : undefined,
  platform: flags.platform,
});

let merged = resolution;
let llmNarrative;
if (flags.llm) {
  const llm = await engine.runLlmSelection({
    description: String(flags.describe),
    extraContext: flags.context ? String(flags.context) : undefined,
  });
  llmNarrative = llm.narrative;
  if (llm.answers) {
    merged = { ...resolution, answers: engine.mergeAnswers({ matrix: resolution.answers, llm: llm.answers, userPlatform: flags.platform }) };
  }
}

const name = flags.name ? String(flags.name) : "my-app";
if (flags.mapping) {
  console.log(engine.formatMappingSection(merged, name));
} else {
  console.log(engine.formatTechnicalProposal({
    projectName: name,
    description: String(flags.describe),
    resolution: merged,
    llmNarrative,
  }));
}
