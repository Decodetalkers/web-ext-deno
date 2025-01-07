import * as log from "@std/log";

export async function reloadSupport(callback: () => Promise<void>) {
  const stdin = Deno.stdin.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(
      new TransformStream<string, string>({
        transform(chunk, controller) {
          controller.enqueue(chunk.trim()); // Trim whitespace and newline
        },
      }),
    );

  log.info("Press 'R' to reload or 'Q' to quit.");

  for await (const input of stdin) {
    if (input === "R") {
      log.info("Reloading...");
      await callback();
    } else if (input === "Q") {
      log.info("Quitting...");
      Deno.exit(0);
    }
  }
}
