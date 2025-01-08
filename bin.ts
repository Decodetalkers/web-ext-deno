import { parseArgs } from "@std/cli";
import type { CMDOptions, ExtTarget } from "./run.ts";
import webExt from "./mod.ts";

import * as log from "@std/log";

interface ArgParses {
  run?: boolean;
  sourceDir?: string;
  browser?: ExtTarget;
  shouldExistProgram?: boolean;
  verbos?: boolean;

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
