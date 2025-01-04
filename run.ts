import runExtensionChrome from "./chrome.ts";
import runExtensionFirefox from "./firefox.ts";

export type ExtTarget = "firefox" | "chrome";

export type BrowserInfo = {
  browser: ExtTarget;
  path?: string;
};

export type WebExtensionInit = {
  browserInfo: BrowserInfo;
  sourceDir: string;
};

function browserPath(browser: ExtTarget): string {
  switch (browser) {
    case "chrome":
      return "chromium";
    case "firefox":
      return "firefox";
  }
}

async function cmd({ browserInfo, sourceDir }: WebExtensionInit) {
  const exePath = browserInfo.path || browserPath(browserInfo.browser);
  let child: Deno.ChildProcess;
  switch (browserInfo.browser) {
    case "firefox":
      child = runExtensionFirefox(exePath, sourceDir);
      break;
    default:
      child = runExtensionChrome(exePath, sourceDir);
      break;
  }
  const status = await child.status;
  console.log(`status: ${status}`);
}
export default { cmd };
