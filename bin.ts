import { parseArgs } from "@std/cli";
import type { CMDOptions, ExtTarget } from "./run.ts";
import webExt from "./mod.ts";

import * as log from "@std/log";
import file from "./deno.json" with { type: "json" };

import { blue, yellow } from "@std/fmt/colors";

const version = file.version;

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

  help?: boolean;
  version?: boolean;
}

function argsToOptions(args: ArgParses): CMDOptions {
  switch (args.browser) {
    case "firefox":
      return { port: args.port, devtool: args.devtool, profile: args.profile };

    default:
      return { newDataDir: args.newDataDir, port: args.port };
  }
}

function getVersion() {
  console.log(`version ${version}`);
  Deno.exit(0);
}
function help() {
  console.log(blue("welcome to web-ext cli"));
  console.log();
  console.log(
    `${yellow("--run")}      run and debug the program`,
  );
  console.log(
    `${yellow("--build")}    build the xpi file`,
  );
  console.log(`${yellow("--version")}  get the project version`);
  console.log();
  console.log(`version ${version}`);
  Deno.exit(0);
}

const args = parseArgs(Deno.args) as ArgParses;

if (args.help) {
  help();
}

if (args.version) {
  getVersion();
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
  const browser = args.browser!;
  const shouldExitProgram = args.shouldExitProgram;
  const options = argsToOptions(args);
  await webExt.cmd(
    { browserInfo: { browser }, sourceDir },
    { shouldExitProgram, options },
  );
}
