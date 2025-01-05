import * as path from "@std/path";
import { BlobWriter, Uint8ArrayReader, ZipWriter } from "@zip-js/zip-js";
import { walk } from "@std/fs/walk";

export type XpiInfo = {
  zipFileWriter: BlobWriter;
  id: string;
};

export async function packageXpi(sourceDir: string): Promise<XpiInfo> {
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
  let manifestJson = path.join(
    path.join(sourceDir, "manifest.json"),
  );
  if (!path.isAbsolute(manifestJson)) {
    manifestJson = path.join(
      Deno.cwd(),
      manifestJson,
    );
  }

  const fileData = await fetch(`file://${manifestJson}`);
  const jsonData = await fileData.json();
  const id = jsonData["applications"]["gecko"]["id"] as string;
  return { zipFileWriter, id };
}
