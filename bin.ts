import { parseArgs } from "@std/cli";
import type { ExtTarget } from "./run.ts";
import webExt from "./mod.ts";

interface ArgParses {
  run?: boolean;
  sourceDir?: string;
  browser?: ExtTarget;
  shouldExistProgram?: boolean;
}

const args = parseArgs(Deno.args) as ArgParses;
if (args.run && args.sourceDir) {
  const sourceDir = args.sourceDir;
  const browser = args.browser!;
  const shouldExistProgram = args.shouldExistProgram;
  webExt.cmd(
    { browserInfo: { browser }, sourceDir },
    { shouldExistProgram },
  );
}
