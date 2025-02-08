import { packageXpi } from "@nobody/xpi-util";
import { CommonDecoder } from "./common.ts";
import { ensureDir } from "@std/fs";
export default async function build(sourceDir: string, targetFolder?: string) {
  if (targetFolder) {
    await ensureDir(targetFolder);
  }
  await packageXpi(sourceDir, CommonDecoder, targetFolder);
}
