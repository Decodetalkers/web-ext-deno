import { RemoteTempInstallNotSupported, WebExtError } from "./error.ts";
import { FirefoxConnection } from "./rdp-client.ts";
import { delay } from "@std/async";
import * as log from "@std/log";
export class FirefoxRemote {
  client: FirefoxConnection;
  constructor(client: FirefoxConnection) {
    this.client = client;
  }
  async getAddonsActor(): Promise<string> {
    try {
      // getRoot should work since Firefox 55 (bug 1352157).
      const response = await this.client.request("getRoot");
      if (response.addonsActor == null) {
        return Promise.reject(
          new RemoteTempInstallNotSupported(
            "This version of Firefox does not provide an add-ons actor for " +
              "remote installation.",
          ),
        );
      }
      return response.addonsActor;
    } catch (err) {
      // Fallback to listTabs otherwise, Firefox 49 - 77 (bug 1618691).
      log.debug("Falling back to listTabs because getRoot failed", err);
    }

    try {
      const response = await this.client.request("listTabs");
      // addonsActor was added to listTabs in Firefox 49 (bug 1273183).
      if (response.addonsActor == null) {
        return Promise.reject(
          new RemoteTempInstallNotSupported(
            "This is an older version of Firefox that does not provide an " +
              "add-ons actor for remote installation. Try Firefox 49 or " +
              "higher.",
          ),
        );
      }
      return response.addonsActor;
    } catch (err) {
      throw new WebExtError(`Remote Firefox: listTabs() error: ${err}`);
    }
  }

  async installTemporaryAddon(
    addonPath: string,
    openDevTools: boolean,
  ) {
    const addonsActor = await this.getAddonsActor();

    const response = await this.client.request({
      to: addonsActor,
      type: "installTemporaryAddon",
      addonPath,
      openDevTools,
    });
    return response;
  }
}

export async function connectToFirefox(
  { port, maxRetryTimes = 20 }: { port: number; maxRetryTimes?: number },
): Promise<FirefoxRemote> {
  const client = new FirefoxConnection();
  let retryTimes = 0;
  while (true) {
    if (retryTimes > maxRetryTimes) {
      throw new Error("max retry time");
    }
    try {
      retryTimes += 1;
      await client.connect(port);
      break;
    } catch (e) {
      log.debug(e);
      await delay(200);
    }
  }
  return new FirefoxRemote(client);
}
