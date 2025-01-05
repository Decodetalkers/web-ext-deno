import * as path from "@std/path";
import { packageXpi } from "./packageXpi.ts";

async function runExtension(
  exePath: string,
  sourceDir: string,
): Promise<Deno.ChildProcess> {
  const tempDir = await Deno.makeTempDir();
  const profileDir = path.join(tempDir, "profile");
  await Deno.mkdir(profileDir);
  const profileCreate = new Deno.Command(exePath, {
    args: ["-createProfile", `dev-profile2 ${profileDir}`],
    stdin: "piped",
    stdout: "inherit",
  });
  const create_child = profileCreate.spawn();
  await create_child.status;
  await zipToXpi(sourceDir, profileDir);
  const command = new Deno.Command(exePath, {
    args: [
      "--profile",
      profileDir,
    ],
    stdin: "piped",
    stdout: "inherit",
  });
  const child = command.spawn();
  return child;
}

async function zipToXpi(sourceDir: string, profileDir: string) {
  const extensionDir = path.join(profileDir, "extensions");
  await Deno.mkdir(extensionDir);

  const { zipFileWriter, id } = await packageXpi(sourceDir);

  const extensionPath = path.join(extensionDir, `${id}.xpi`);
  const zipFileBlob: Blob = await zipFileWriter.getData();

  await Deno.writeFile(extensionPath, zipFileBlob.stream());
}

export default runExtension;
