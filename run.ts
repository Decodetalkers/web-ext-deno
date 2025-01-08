import runExtensionChromium, { type ChromiumOptions } from "./chromium.ts";
import runExtensionFirefox, { type FirefoxOptions } from "./firefox.ts";

export type ExtTarget = "firefox" | "chrome";

export type BrowserInfo = {
  browser: ExtTarget;
  path?: string;
};

export type WebExtensionInfo = {
  browserInfo: BrowserInfo;
  sourceDir: string;
};

export type WebExtensionInit = {
  shouldExistProgram?: boolean;
  options: CMDOptions;
};

export type CMDOptions = FirefoxOptions | ChromiumOptions;

export type { ChromiumOptions, FirefoxOptions };

function browserPath(browser: ExtTarget): string {
  switch (browser) {
    case "chrome":
      return "chromium";
    case "firefox":
      return "firefox";
  }
}

async function cmd(
  { browserInfo, sourceDir }: WebExtensionInfo,
  { shouldExistProgram, options }: WebExtensionInit,
) {
  const exePath = browserInfo.path || browserPath(browserInfo.browser);
  switch (browserInfo.browser) {
    case "firefox":
      await runExtensionFirefox(exePath, sourceDir, options as FirefoxOptions);
      break;
    default:
      await runExtensionChromium(
        exePath,
        sourceDir,
        options as ChromiumOptions,
        shouldExistProgram || false,
      );
      break;
  }
}
export default cmd;
