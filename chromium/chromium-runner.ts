import type { ChromiumOptions } from "../run.ts";
import * as path from "@std/path";
import * as log from "@std/log";
import { type ChromiumInstance, runChromium } from "./chromium-cmd.ts";
import { DEFAULT_PORT } from "../common.ts";

const encoder = new TextEncoder();

export type WSSBroadcastType = {
  type: string;
};

export class ChromiumExtensionRunner {
  options: ChromiumOptions;
  sockets: Set<WebSocket> = new Set();
  serve?: Deno.HttpServer<Deno.NetAddr>;
  profilePath?: string;
  sourceDir: string;
  binary: string;

  constructor(options: ChromiumOptions, sourceDir: string, binary: string) {
    this.options = options;
    this.sourceDir = sourceDir;
    this.binary = binary;
  }

  async run(
    { shouldExitBrowser }: { shouldExitBrowser?: boolean },
  ): Promise<ChromiumInstance> {
    await this.setUpProfileDir();
    this.setUpWebSocket();
    const debugExtension = await this.createReloadManagerExtension();

    return runChromium({
      binary: this.binary,
      extensionDir: [this.sourceDir, debugExtension],
      newDataDir: this.options.newDataDir || true,
      tmpDir: this.profilePath!,
      shouldExitBrowser,
    });
  }

  private async setUpProfileDir() {
    const tmpDir = await Deno.makeTempDir();

    Deno.addSignalListener("SIGINT", () => {
      Deno.removeSync(tmpDir, { recursive: true });
    });
    this.profilePath = tmpDir;
  }

  private setUpWebSocket() {
    this.serve = Deno.serve({
      hostname: "localhost",
      port: this.options.port || DEFAULT_PORT,
    }, (req) => {
      const { response, socket } = Deno.upgradeWebSocket(req);
      this.sockets.add(socket);

      return response;
    });
    Deno.addSignalListener("SIGINT", () => {
      this.serve?.shutdown();
    });
  }

  wssBroadcast(data: WSSBroadcastType): Promise<void> {
    return new Promise((resolve) => {
      const clients = this.sockets;
      function cleanWebExtReloadComplete(this: WebSocket) {
        this.removeEventListener("message", webExtReloadComplete);
        this.removeEventListener("close", cleanWebExtReloadComplete);
        clients.delete(this);
      }

      function webExtReloadComplete(
        this: WebSocket,
        // deno-lint-ignore no-explicit-any
        message: MessageEvent<any>,
      ) {
        const msg = JSON.parse(message.data);

        if (msg.type === "webExtReloadExtensionComplete") {
          for (const client of clients) {
            cleanWebExtReloadComplete.call(client);
          }
          resolve();
        }
      }
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.addEventListener("message", webExtReloadComplete);
          client.addEventListener("close", cleanWebExtReloadComplete);

          client.send(JSON.stringify(data));
        } else {
          clients.delete(client);
        }
      }
      if (clients.size === 0) {
        resolve();
      }
    });
  }

  async reloadAllExtensions() {
    await this.wssBroadcast({
      type: "webExtReloadAllExtensions",
    });
    const data = encoder.encode(
      `\rLast extension reload: ${new Date().toTimeString()}`,
    );
    await Deno.stdout.write(
      data,
    );
    log.debug("\n");
  }
  private async createReloadManagerExtension(): Promise<string> {
    const tmpDir = this.profilePath!;

    const extPath = path.join(
      tmpDir,
      `reload-manager-extension-${Date.now()}`,
    );

    log.debug(`Creating reload-manager-extension in ${extPath}`);

    await Deno.mkdir(extPath, { recursive: true });

    await Deno.writeFile(
      path.join(extPath, "manifest.json"),
      encoder.encode(JSON.stringify({
        manifest_version: 2,
        name: "web-ext Reload Manager Extension",
        version: "1.0",
        permissions: ["management", "tabs"],
        background: {
          scripts: ["bg.js"],
        },
      })),
    );

    const wssInfo = this.serve!.addr;

    const bgPage = `(function bgPage() {
      async function getAllDevExtensions() {
        const allExtensions = await new Promise(
          r => chrome.management.getAll(r));

        return allExtensions.filter((extension) => {
          return extension.enabled &&
            extension.installType === "development" &&
            extension.id !== chrome.runtime.id;
        });
      }

      const setEnabled = (extensionId, value) =>
        chrome.runtime.id == extensionId ?
        new Promise.resolve() :
        new Promise(r => chrome.management.setEnabled(extensionId, value, r));

      async function reloadExtension(extensionId) {
        await setEnabled(extensionId, false);
        await setEnabled(extensionId, true);
      }

      const ws = new window.WebSocket(
        "ws://${wssInfo.hostname}:${wssInfo.port}");

      ws.onmessage = async (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'webExtReloadAllExtensions') {
          const devExtensions = await getAllDevExtensions();
          await Promise.all(devExtensions.map(ext => reloadExtension(ext.id)));
          ws.send(JSON.stringify({ type: 'webExtReloadExtensionComplete' }));
        }
      };
    })()`;

    await Deno.writeFile(path.join(extPath, "bg.js"), encoder.encode(bgPage));
    return extPath;
  }
}
