import type { Command } from "commander";
import { listLocalBlueprints } from "@meridian/engine";

export function registerBlueprints(program: Command): void {
  program
    .command("blueprints")
    .option("--json", "JSON 输出", false)
    .action((opts) => {
      const items = listLocalBlueprints().map((item) => ({
        id: item.manifest.id,
        version: item.manifest.version,
        tags: item.manifest.tags,
        description: item.manifest.description,
      }));
      if (opts.json) {
        console.log(JSON.stringify(items, null, 2));
        return;
      }
      console.log("ID".padEnd(24) + "VERSION".padEnd(10) + "TAGS");
      for (const item of items) {
        console.log(item.id.padEnd(24) + item.version.padEnd(10) + item.tags.join(","));
      }
    });
}
