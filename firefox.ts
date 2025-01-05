import * as path from "@std/path";
import { BlobWriter, Uint8ArrayReader, ZipWriter } from "@zip-js/zip-js";
import { walk } from "@std/fs/walk";

async function runExtension(
  exePath: string,
  sourceDir: string,
): Promise<Deno.ChildProcess> {
  const tempDir = await Deno.makeTempDir();
  const profileDir = path.join(tempDir, "profile");
  const profileCreate = new Deno.Command(exePath, {
    args: ["-createProfile", `dev-profile ${profileDir}`],
    stdin: "piped",
    stdout: "piped",
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
    stdout: "piped",
  });
  const child = command.spawn();
  return child;
}

async function zipToXpi(sourceDir: string, profileDir: string) {
  const extensionDir = path.join(profileDir, "extensions");
  await Deno.mkdir(extensionDir);
  const extensionName = "tempextension.xpi";
  const extensionPath = path.join(extensionDir, extensionName);
  const zipFileWriter: BlobWriter = new BlobWriter();

  const zipWriter = new ZipWriter(zipFileWriter);
  for await (const fileEntry of walk(sourceDir)) {
    if (!fileEntry.isFile) {
      continue;
    }
    const data = await Deno.readFile(fileEntry.path);
    const dataReader = new Uint8ArrayReader(data);
    const zippath = path.relative(sourceDir, fileEntry.path);
    await zipWriter.add(zippath, dataReader);
  }
  zipWriter.close();
  const zipFileBlob: Blob = await zipFileWriter.getData();

  await Deno.writeFile(extensionPath, zipFileBlob.stream());
}

export default runExtension;
