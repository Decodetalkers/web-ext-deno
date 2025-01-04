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

function cmd({ browserInfo, sourceDir }: WebExtensionInit) {
  const exePath = browserInfo.path || browserPath(browserInfo.browser);
  switch (browserInfo.browser) {
    case "firefox":
      runExtensionFirefox(exePath, sourceDir);
      break;
    default:
      runExtensionChrome(exePath, sourceDir);
      break;
  }
}
export default { cmd };
