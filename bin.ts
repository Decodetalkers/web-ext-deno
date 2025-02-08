import type { CMDOptions, ExtTarget } from "./run.ts";
import webExt from "./mod.ts";

import * as log from "@std/log";
import file from "./deno.json" with { type: "json" };

import { clapCli, type Command } from "@nobody/deno-clap";

const version = file.version;

const WebExt = {
  run: {
    description: "run the WebExt",
    default: false,
  },
  firefox: {
    description: "run with firefox",
    children: {
      port: {
        description: "with port",
        type: "number",
        default: 8000,
      },
      devtool: {
        description: "with devtool",
        type: "boolean",
        default: false,
      },
      profile: {
        description: "with profile",
        type: "string",
      },
    },
  },
  chromium: {
    description: "run with chromium",
    children: {
      newDataDir: {
        description: "withNewDataDir",
        type: "boolean",
        default: true,
      },
      port: {
        description: "with port",
        type: "number",
        default: 8000,
      },
    },
  },
  targetDir: {
    description: "set the targetDir",
    default: "./",
    type: "string",
  },
  shouldExitProgram: {
    description: "should exit browser after exit program",
    default: true,
    type: "boolean",
  },
  build: {
    description: "build the target to xpi",
    default: false,
    type: "boolean",
  },
  sourceDir: {
    description: "set the path of source for the program to read",
    type: "string",
  },
  verbos: {
    description: "tracing the log",
    default: false,
    type: "boolean",
  },
} as const;

const cmd: Command = {
  exeName: "web-ext",
  description: "web-ext in deno",
  author: "Decodetalkers",
  version: version,
};

const argsPre = clapCli(WebExt, cmd);

if (!argsPre) {
  Deno.exit();
}
const args = argsPre!;

type ArgInfo = typeof args;

function argsToOptions(args: ArgInfo): CMDOptions {
  if (args.firefox) {
    return args.firefox;
  }
  if (args.chromium) {
    return args.chromium;
  }
  return {};
}

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
  const shouldExitProgram = args.shouldExitProgram;
  const options = argsToOptions(args)!;

  let browser: ExtTarget = "firefox";
  if (args.chromium) {
    browser = "chrome";
  }
  await webExt.cmd(
    { browserInfo: { browser }, sourceDir },
    { shouldExitProgram, options },
  );
}
