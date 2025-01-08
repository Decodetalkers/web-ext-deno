import { runChromium } from "./chromium/chromium-cmd.ts";
import * as log from "@std/log";

export * as ChromiumCMD from "./chromium/chromium-cmd.ts";

export type ChromiumOptions = {
  newDataDir?: boolean;
};

async function runExtension(
  exePath: string,
  sourceDir: string,
  { newDataDir }: ChromiumOptions,
  _shouldExistProgram: boolean,
) {
  const { args } = await runChromium({
    binary: exePath,
    extensionDir: sourceDir,
    newDataDir,
  });
  log.debug(args);
}

export default runExtension;
