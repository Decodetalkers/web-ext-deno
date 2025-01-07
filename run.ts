import runExtensionChromium from "./chromium.ts";
import runExtensionFirefox from "./firefox.ts";

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
};

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
  { shouldExistProgram }: WebExtensionInit,
) {
  const exePath = browserInfo.path || browserPath(browserInfo.browser);
  switch (browserInfo.browser) {
    case "firefox":
      await runExtensionFirefox(exePath, sourceDir);
      break;
    default:
      await runExtensionChromium(
        exePath,
        sourceDir,
        shouldExistProgram || false,
      );
      break;
  }
}
export default cmd;
