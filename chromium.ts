import * as log from "@std/log";
import { ChromiumExtensionRunner } from "./chromium/chromium-runner.ts";
import { reloadSupport } from "./reload.ts";

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
  shouldExitProgram: boolean,
) {
  const chromiumRunner = new ChromiumExtensionRunner(
    options,
    sourceDir,
    exePath,
  );
  const { args } = await chromiumRunner.run({
    shouldExitBrowser: shouldExitProgram,
  });
  log.debug(args);
  await reloadSupport(async () => {
    try {
      await chromiumRunner.reloadAllExtensions();
    } catch (e) {
      log.error((e as Error).message);
    }
  });
}

export default runExtension;
