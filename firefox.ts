import FirefoxProfile from "firefox-profile";

import { runFirefox } from "./firefox/firefox-cmd.ts";
import { connectToFirefox } from "./firefox/remote.ts";
import { isAbsolute, join } from "@std/path";

import * as log from "@std/log";
import { configureProfile } from "./firefox/preference.ts";

const DEFAULT_PORT: number = 41835;

async function runExtension(
  exePath: string,
  sourceDir: string,
) {
  const firefoxTmpProfile = new FirefoxProfile();
  configureProfile(firefoxTmpProfile);
  const profile = firefoxTmpProfile.path();
  const { args } = runFirefox({
    binary: exePath,
    profile,
    port: DEFAULT_PORT,
    foreground: true,
    noRemote: true,
  });

  log.debug(`firefox args, ${args}`);
  let pluginDir = sourceDir;
  if (!isAbsolute(pluginDir)) {
    pluginDir = join(Deno.cwd(), pluginDir);
  }
  const remoteFirefox = await connectToFirefox({ port: DEFAULT_PORT });

  await remoteFirefox.installTemporaryAddon(pluginDir, false);
}

export default runExtension;
