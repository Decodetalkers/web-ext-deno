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
  reloadCli: boolean = false,
): Promise<ChromiumExtensionRunner> {
  const chromiumRunner = new ChromiumExtensionRunner(
    options,
    sourceDir,
    exePath,
  );
  const { args } = await chromiumRunner.run({
    shouldExitBrowser: shouldExitProgram,
  });

  log.debug(args);
  if (reloadCli) {
    await reloadSupport(async () => {
      try {
        await chromiumRunner.reloadAllExtensions();
      } catch (e) {
        log.error((e as Error).message);
      }
    });
  }
  Deno.addSignalListener("SIGINT", () => {
    Deno.exit(0);
  });

  return chromiumRunner;
}

export default runExtension;
