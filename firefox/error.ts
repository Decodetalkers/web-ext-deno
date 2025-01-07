/*
 * Base error for all custom web-ext errors.
 */
export class WebExtError extends Error {
  constructor(message: string) {
    super(message);
  }
}

/*
 * The class for errors that can be fixed by the developer.
 */
export class ConnectError extends WebExtError {
  constructor(message: string) {
    super(message);
  }
}


/*
 * The class for errors that can be fixed by the developer.
 */
export class UsageError extends WebExtError {
  constructor(message: string) {
    super(message);
  }
}

/*
 * The manifest for the extension is invalid (or missing).
 */
export class InvalidManifest extends UsageError {
  constructor(message: string) {
    super(message);
  }
}

/*
 * The remote Firefox does not support temporary add-on installation.
 */
export class RemoteTempInstallNotSupported extends WebExtError {
  constructor(message: string) {
    super(message);
  }
}
