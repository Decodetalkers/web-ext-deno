import {
  RemoteTempInstallNotSupported,
  UsageError,
  WebExtError,
} from "../error.ts";
import type { RDPData } from "./rdp-client.ts";
import { type AddonInfo, FirefoxConnection } from "./rdp-client.ts";
import { delay } from "@std/async";
import * as log from "@std/log";
const encoder = new TextEncoder();
export class FirefoxRemote {
  client: FirefoxConnection;
  checkedForAddonReloading: boolean = false;
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
  ): Promise<RDPData> {
    const addonsActor = await this.getAddonsActor();

    const response = await this.client.request({
      to: addonsActor,
      type: "installTemporaryAddon",
      addonPath,
      openDevTools,
    });
    return response;
  }

  async getInstalledAddon(addonId: string): Promise<AddonInfo> {
    try {
      const response = await this.allInstalledAddons();
      for (const addon of response.addons) {
        if (addon.id === addonId) {
          return addon;
        }
      }
      log.debug(
        `Remote Firefox has these addons: ${
          response.addons.map((a: AddonInfo) => a.id)
        }`,
      );
      return Promise.reject(
        new WebExtError(
          "The remote Firefox does not have your extension installed",
        ),
      );
    } catch (err) {
      throw new WebExtError(`Remote Firefox: listAddons() error: ${err}`);
    }
  }

  async addonRequest(addon: AddonInfo, request: string): Promise<RDPData> {
    try {
      const response = await this.client.request({
        to: addon.actor,
        type: request,
      });
      return response;
    } catch (err) {
      log.debug(`Client responded to '${request}' request with error:`, err);
      throw new WebExtError(`Remote Firefox: addonRequest() error: ${err}`);
    }
  }

  async checkForAddonReloading(addon: AddonInfo): Promise<AddonInfo> {
    if (this.checkedForAddonReloading) {
      // We only need to check once if reload() is supported.
      return addon;
    } else {
      const response = await this.addonRequest(addon, "requestTypes");

      if (response.requestTypes.indexOf("reload") === -1) {
        const supportedRequestTypes = JSON.stringify(response.requestTypes);
        log.debug(`Remote Firefox only supports: ${supportedRequestTypes}`);
        throw new UsageError(
          "This Firefox version does not support add-on reloading. " +
            "Re-run with --no-reload",
        );
      } else {
        this.checkedForAddonReloading = true;
        return addon;
      }
    }
  }

  async reloadAddon(addonId: string) {
    const addon = await this.getInstalledAddon(addonId);
    await this.checkForAddonReloading(addon);
    await this.addonRequest(addon, "reload");
    const data = encoder.encode(
      `\rLast extension reload: ${new Date().toTimeString()}`,
    );
    await Deno.stdout.write(
      data,
    );
    log.debug("\n");
  }

  async allInstalledAddons(): Promise<RDPData> {
    return await this.client.request("listAddons");
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
      log.debug((e as Error).message);
      await delay(200);
    }
  }
  return new FirefoxRemote(client);
}
