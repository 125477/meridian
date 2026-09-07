import { Command } from "commander";
import { MeridianError, loadEnvFile } from "@meridian/engine";
import { registerCreate } from "./commands/create.js";
import { registerResolve } from "./commands/resolve.js";
import { registerDoctor } from "./commands/doctor.js";
import { registerAdd } from "./commands/add.js";
import { registerFinish } from "./commands/finish.js";
import { registerBlueprints } from "./commands/blueprints.js";
import { registerSetupAgent } from "./commands/setup-agent.js";
import { registerCi } from "./commands/ci.js";

const program = new Command();
program
  .name("meridian")
  .description("Meridian — 需求描述到前端工作区的脚手架")
  .version("0.1.0");

registerCreate(program);
registerResolve(program);
registerDoctor(program);
registerAdd(program);
registerFinish(program);
registerBlueprints(program);
registerSetupAgent(program);
registerCi(program);

async function main(): Promise<void> {
  loadEnvFile();
  try {
    const argv = process.argv.slice(2);
    if (argv.length === 0 || (argv[0] && !argv[0].startsWith("-") && !commandNames().includes(argv[0]))) {
      if (argv[0] && !argv[0].startsWith("-") && argv[0] !== "create") {
        process.argv.splice(2, 0, "create");
      }
    }
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof MeridianError) {
      console.error(`✖ [${error.code}] ${error.message}`);
      process.exitCode = 1;
      return;
    }
    console.error(error);
    process.exitCode = 1;
  }
}

function commandNames(): string[] {
  return ["create", "resolve", "doctor", "add", "finish", "blueprints", "setup-agent", "ci"];
}

void main();
