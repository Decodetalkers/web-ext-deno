function isProfileName(profile: string) {
  if (!profile) {
    return false;
  }
  return !/[\\\/]/.test(profile);
}

export type FirefoxOptions = {
  binary?: string;
  profile?: string;
  foreground?: boolean;
  noRemote?: boolean;
  port?: number;
};

function buildArgs(options: FirefoxOptions): string[] {
  const args: string[] = [];

  if (options.profile) {
    if (isProfileName(options.profile)) {
      args.unshift("-P", options.profile);
    } else {
      args.unshift("-profile", options.profile);
    }
  }

  if (options.noRemote) {
    args.unshift("-no-remote");
  }

  if (options.foreground) {
    args.unshift("-foreground");
  }

  if (options.port) {
    args.unshift("-start-debugger-server", options.port.toString());
  }

  return args;
}

export type FirefoxInstance = {
  binary: string;
  child: Deno.ChildProcess;
  args: string[];
};

export function runFirefox(
  profile: FirefoxOptions,
): FirefoxInstance {
  const args = buildArgs(profile);
  const binary = profile.binary || "firefox";
  const command = new Deno.Command(binary, {
    args,
    stdin: "piped",
    stdout: "piped",
  });
  const child = command.spawn();
  globalThis.addEventListener("unload", () => {
    child.kill();
  });

  return {
    binary,
    child,
    args,
  };
}
