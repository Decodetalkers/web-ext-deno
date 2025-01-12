import { parseArgs } from "@std/cli";
import type { CMDOptions, ExtTarget } from "./run.ts";
import webExt from "./mod.ts";

import * as log from "@std/log";

interface ArgParses {
  run?: boolean;
  build?: boolean;
  sourceDir?: string;
  browser?: ExtTarget;
  shouldExitProgram?: boolean;
  verbos?: boolean;

  // shared
  port?: number;

  // firefox:
  devtool?: boolean;
  profile?: string;

  // chromium
  newDataDir?: boolean;

  // build
  targetDir?: string;
}

function argsToOptions(args: ArgParses): CMDOptions {
  switch (args.browser) {
    case "firefox":
      return { port: args.port, devtool: args.devtool, profile: args.profile };

    default:
      return { newDataDir: args.newDataDir, port: args.port };
  }
}

const args = parseArgs(Deno.args) as ArgParses;

if (args.verbos) {
  log.setup({
    handlers: {
      console: new log.ConsoleHandler("DEBUG", {
        useColors: true,
      }), // Set the log level
    },
    loggers: {
      default: {
        level: "DEBUG", // Set the logger's level to debug
        handlers: ["console"],
      },
    },
  });
}

if (args.build && args.sourceDir) {
  await webExt.build(args.sourceDir, args.targetDir);
}

if (args.run && args.sourceDir) {
  const sourceDir = args.sourceDir;
  const browser = args.browser!;
  const shouldExitProgram = args.shouldExitProgram;
  const options = argsToOptions(args);
  await webExt.cmd(
    { browserInfo: { browser }, sourceDir },
    { shouldExitProgram, options },
  );
}
