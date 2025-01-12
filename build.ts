import { packageXpi } from "@nobody/xpi-util";
import { CommonDecoder } from "./common.ts";
export default async function build(sourceDir: string, targetFoldr?: string) {
  await packageXpi(sourceDir, CommonDecoder, targetFoldr);
}
