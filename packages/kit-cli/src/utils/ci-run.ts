import { spawnSync } from "node:child_process";

export function runCommand(
  cwd: string,
  command: string,
  args: string[],
): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: process.env });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}
