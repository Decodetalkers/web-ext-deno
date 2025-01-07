function runExtension(
  exePath: string,
  sourceDir: string,
  _shouldExistProgram: boolean,
) {
  const command = new Deno.Command(exePath, {
    args: [
      `--load-extension=${sourceDir}`,
    ],
    stdin: "inherit",
    stdout: "inherit",
  });
  const child = command.spawn();
  globalThis.addEventListener("unload", () => {
    child.kill();
  });
}

export default runExtension;
