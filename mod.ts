import cmd from "./run.ts";
import build from "./build.ts";

export type {
  BrowserInfo,
  ChromiumOptions,
  CMDOptions,
  ExtTarget,
  FirefoxOptions,
  WebExtensionInfo,
  WebExtensionInit,
} from "./run.ts";

export default { cmd, build };
