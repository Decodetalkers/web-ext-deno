function runExtension(
  exePath: string,
  sourceDir: string,
  _shouldExistProgram: boolean,
) {
  const command = new Deno.Command(exePath, {
    args: [
      `--load-extension=${sourceDir}`,
    ],
    stdin: "piped",
    stdout: "piped",
  });
  const child = command.spawn();
  globalThis.addEventListener("unload", () => {
    child.kill();
  });
}

export default runExtension;
