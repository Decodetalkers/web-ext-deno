import * as log from "@std/log";
import { ChromiumExtensionRunner } from "./chromium/chromium-runner.ts";

export * as ChromiumCMD from "./chromium/chromium-cmd.ts";

export * as ChromiumRun from "./chromium/chromium-runner.ts";

export type ChromiumOptions = {
  newDataDir?: boolean;
  port?: number;
};

async function runExtension(
  exePath: string,
  sourceDir: string,
  options: ChromiumOptions,
  _shouldExistProgram: boolean,
) {
  const chromiumRunner = new ChromiumExtensionRunner(
    options,
    sourceDir,
    exePath,
  );
  const { args } = await chromiumRunner.run();
  log.debug(args);
}

export default runExtension;
