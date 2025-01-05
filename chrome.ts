function runExtension(
  exePath: string,
  sourceDir: string,
  _shouldExistProgram: boolean,
): Deno.ChildProcess {
  const command = new Deno.Command(exePath, {
    args: [
      `--load-extension=${sourceDir}`,
    ],
    stdin: "piped",
    stdout: "piped",
  });
  const child = command.spawn();
  return child;
}

export default runExtension;
