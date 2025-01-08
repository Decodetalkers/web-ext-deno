import { parseArgs } from "@std/cli";
import type { CMDOptions, ExtTarget } from "./run.ts";
import webExt from "./mod.ts";

interface ArgParses {
  run?: boolean;
  sourceDir?: string;
  browser?: ExtTarget;
  shouldExistProgram?: boolean;

  // firefox:
  port?: number;
  devtool?: boolean;
  profile?: string;

  // chromium
  newDataDir?: boolean;
}

function argsToOptions(args: ArgParses): CMDOptions {
  switch (args.browser) {
    case "firefox":
      return { port: args.port, devtool: args.devtool, profile: args.profile };

    default:
      return { newDataDir: args.newDataDir };
  }
}

const args = parseArgs(Deno.args) as ArgParses;
if (args.run && args.sourceDir) {
  const sourceDir = args.sourceDir;
  const browser = args.browser!;
  const shouldExistProgram = args.shouldExistProgram;
  const options = argsToOptions(args);
  webExt.cmd(
    { browserInfo: { browser }, sourceDir },
    { shouldExistProgram, options },
  );
}
