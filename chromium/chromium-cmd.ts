export type ChromiumOptions = {
  binary?: string;
  extensionDir: string[];
  newDataDir?: boolean;
  tmpDir: string;
  shouldExitBrowser?: boolean;
};

function buildArgs(options: ChromiumOptions): string[] {
  const args: string[] = [];

  const extensionDir = options.extensionDir.join(",");
  args.unshift(`--load-extension=${extensionDir}`);
  if (options.newDataDir) {
    args.unshift(`--user-data-dir=${options.tmpDir}`);
  }

  return args;
}
export type ChromiumInstance = {
  binary: string;
  child: Deno.ChildProcess;
  args: string[];
};

export function runChromium(
  options: ChromiumOptions,
): ChromiumInstance {
  const args = buildArgs(options);
  const binary = options.binary || "chromium";
  const command = new Deno.Command(binary, {
    args,
    stdin: "inherit",
    stdout: "inherit",
  });
  const child = command.spawn();
  if (options.shouldExitBrowser) {
    globalThis.addEventListener("unload", () => {
      child.kill();
    });
  }

  return { binary, child, args };
}
