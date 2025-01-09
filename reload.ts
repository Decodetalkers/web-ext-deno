import * as log from "@std/log";
import { CommonEncoder } from "./common.ts";

const abortController = new AbortController();
const { signal } = abortController;
const signalPromise = new Promise<void>((resolve, _) => {
  signal.addEventListener("abort", () => {
    resolve();
  });
});

Deno.stdin.setRaw(true, { cbreak: true });

Deno.addSignalListener("SIGINT", () => {
  abortController.abort();
});

export async function reloadSupport(
  callback: () => Promise<void>,
): Promise<void> {
  const stdin = Deno.stdin.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new TransformStream<string, string>({
        transform(chunk, controller) {
          controller.enqueue(chunk.trim()); // Trim whitespace and newline
        },
      }),
    );
  const reader = stdin.getReader();
  await Promise.race([
    reloadSupportInner(reader, callback),
    signalPromise,
  ]);
  reader.releaseLock();
  await stdin.cancel();

  Deno.exit(0);
}

async function reloadSupportInner(
  reader: ReadableStreamDefaultReader<string>,
  callback: () => Promise<void>,
) {
  log.info("Press 'R' to reload or 'Q' to quit.");

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break; // End of `stdin`

      if (value == "R") {
        log.info("Reloading...");
        callback();
        continue;
      }
      if (value == "Q") {
        log.info("Quitting...");
        Deno.exit(0);
      }
      await Deno.stdout.write(
        CommonEncoder.encode("\n"),
      );
    }
  } finally {
    reader.releaseLock();
  }
}
