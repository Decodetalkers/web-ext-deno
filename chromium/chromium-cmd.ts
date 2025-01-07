export type ChromiumOptions = {
  binary?: string;
  extensionDir: string;
  newDataDir?: boolean;
};

async function buildArgs(options: ChromiumOptions): Promise<string[]> {
  const args: string[] = [];

  args.unshift(`--load-extension=${options.extensionDir}`);
  if (options.newDataDir) {
    const tmpDir = await Deno.makeTempDir();
    globalThis.addEventListener("unload", () => {
      Deno.removeSync(tmpDir);
    });
    args.unshift(`--user-data-dir=${tmpDir}`);
  }

  return args;
}
export type ChromiumInstance = {
  binary: string;
  child: Deno.ChildProcess;
  args: string[];
};
export async function runChromium(
  options: ChromiumOptions,
): Promise<ChromiumInstance> {
  const args = await buildArgs(options);
  const binary = options.binary || "chromium";
  const command = new Deno.Command(binary, {
    args,
    stdin: "inherit",
    stdout: "inherit",
  });
  const child = command.spawn();
  Deno.addSignalListener("SIGINT", () => {
    child.kill();
  });
  return { binary, child, args };
}
