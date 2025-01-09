import { FirefoxProfile } from "@nobody/firefox-profile-deno";

import { runFirefox } from "./firefox/firefox-cmd.ts";
import { connectToFirefox, type FirefoxRemote } from "./firefox/remote.ts";
import { isAbsolute, join } from "@std/path";

import * as log from "@std/log";
import { configureProfile } from "./firefox/preference.ts";
import { reloadSupport } from "./reload.ts";
import { DEFAULT_PORT } from "./common.ts";

export * as remote from "./firefox/remote.ts";
export * as preference from "./firefox/preference.ts";
export * as rdpClient from "./firefox/rdp-client.ts";
export * as firefoxCMD from "./firefox/firefox-cmd.ts";

export type FirefoxOptions = {
  port?: number;
  devtool?: boolean;
  profile?: string;
};

async function runExtension(
  exePath: string,
  sourceDir: string,
  options: FirefoxOptions,
  shouldExitProgram: boolean,
  reloadCli: boolean = false,
): Promise<FirefoxRemote> {
  let profile = options.profile;
  if (!profile) {
    const firefoxTmpProfile = new FirefoxProfile();
    configureProfile(firefoxTmpProfile);
    profile = firefoxTmpProfile.path();
  }
  const port = options.port || DEFAULT_PORT;
  const devtool = options.devtool || false;

  const { args } = runFirefox({
    binary: exePath,
    profile,
    port,
    foreground: true,
    noRemote: true,
    shouldExitBrowser: shouldExitProgram,
  });

  log.debug(`firefox args, ${args}`);
  let pluginDir = sourceDir;
  if (!isAbsolute(pluginDir)) {
    pluginDir = join(Deno.cwd(), pluginDir);
  }
  const remoteFirefox = await connectToFirefox({ port });

  const plugin = await remoteFirefox.installTemporaryAddon(pluginDir, devtool);

  Deno.addSignalListener("SIGINT", () => {
    Deno.exit(0);
  });

  log.debug(`plugin info ${plugin}`);

  const pluginId: string = plugin.addon.id;

  if (reloadCli) {
    await reloadSupport(async () => {
      try {
        await remoteFirefox.reloadAddon(pluginId);
      } catch (e) {
        log.error((e as Error).message);
      }
    });
  }
  return remoteFirefox;
}

export default runExtension;
