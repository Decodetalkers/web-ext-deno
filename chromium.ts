import { runChromium } from "./chromium/chromium-cmd.ts";
import * as log from "@std/log";

async function runExtension(
  exePath: string,
  sourceDir: string,
  _shouldExistProgram: boolean,
) {
  const { args } = await runChromium({
    binary: exePath,
    extensionDir: sourceDir,
    newDataDir: true,
  });
  log.debug(args);
}

export default runExtension;
