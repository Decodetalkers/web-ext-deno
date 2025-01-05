import runExtensionChrome from "./chrome.ts";
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
  let child: Deno.ChildProcess;
  switch (browserInfo.browser) {
    case "firefox":
      child = runExtensionFirefox(exePath, sourceDir);
      break;
    default:
      child = runExtensionChrome(
        exePath,
        sourceDir,
        shouldExistProgram || false,
      );
      break;
  }
  const status = await child.status;
  console.log(`status: ${status}`);
}
export default cmd;
