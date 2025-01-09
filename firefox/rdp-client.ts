import * as log from "@std/log";
import { CommonDecoder } from "../common.ts";
export type Deferred = {
  resolve: (value: RDPData) => void;
  // deno-lint-ignore no-explicit-any
  reject: (reason?: any) => void;
};

export type RDPData = {
  from: string;
  addons?: RDPAddonInfo[];
  // deno-lint-ignore no-explicit-any
  [key: string]: any; // Allows other unknown keys
};

export type RDPMessage = {
  data: Uint8Array;
  rdpMessage?: RDPData;
  error?: Error | unknown;
  fatal?: boolean;
};

export type RDPRequest = {
  to: string;
  type: string;
  // deno-lint-ignore no-explicit-any
  [key: string]: any; // Allows other unknown keys
};

export type Pending = {
  request: RDPRequest;
  deferred: Deferred;
};

export type RDPAddonInfo = {
  id: string;
  actor: string;
  // deno-lint-ignore no-explicit-any
  [key: string]: any; // Allows other unknown keys
};

// Parse RDP packets: BYTE_LENGTH + ':' + DATA.
export function parseRDPMessage(data: Uint8Array): RDPMessage {
  const str = CommonDecoder.decode(data);
  const sepIdx = str.indexOf(":");
  if (sepIdx < 1) {
    return { data };
  }

  const byteLen = parseInt(str.slice(0, sepIdx));
  if (isNaN(byteLen)) {
    const error = new Error("Error parsing RDP message length");
    return { data, error, fatal: true };
  }

  if (data.length - (sepIdx + 1) < byteLen) {
    // Can't parse yet, will retry once more data has been received.
    return { data };
  }

  data = data.slice(sepIdx + 1);
  const msg = CommonDecoder.decode(data.slice(0, byteLen));
  data = data.slice(byteLen);

  try {
    return { data, rdpMessage: JSON.parse(msg.toString()) };
  } catch (error) {
    return { data, error, fatal: false };
  }
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

const UNSOLICITED_EVENTS = new Set([
  "tabNavigated",
  "styleApplied",
  "propertyChange",
  "networkEventUpdate",
  "networkEvent",
  "propertyChange",
  "newMutations",
  "frameUpdate",
  "tabListChanged",
]);

export class FirefoxConnection extends EventTarget {
  rdpConnection?: Deno.TcpConn;
  private incoming: Uint8Array = new Uint8Array();
  private pending: Pending[] = [];
  private active: Map<string, Deferred> = new Map();
  constructor() {
    super();
    globalThis.addEventListener("unload", () => {
      this.disconnect();
    });
  }

  // deno-lint-ignore no-explicit-any
  emit(eventName: string, detail?: any) {
    const event = new CustomEvent(eventName, { detail });
    this.dispatchEvent(event);
  }

  on(eventName: string, listener: (event: Event) => void) {
    this.addEventListener(eventName, listener);
  }

  off(eventName: string, listener: (event: Event) => void) {
    this.removeEventListener(eventName, listener);
  }

  private onData(newData: Uint8Array) {
    const newIncoming = concatUint8Arrays(this.incoming, newData);
    this.readMessage(newIncoming);
  }

  private onEnd() {
    this.emit("end");
  }

  private onError(error: Error) {
    this.emit("error", error);
  }

  private readMessage(newIncoming: Uint8Array): boolean {
    const { data, rdpMessage, error, fatal } = parseRDPMessage(newIncoming);
    this.incoming = data;
    if (error) {
      this.emit(
        "error",
        new Error(`Error parsing RDP packet: ${String(error)}`),
      );
      if (fatal) {
        this.disconnect();
      }
      return !fatal;
    }
    if (!rdpMessage) {
      return false;
    }
    this.handleMessage(rdpMessage);
    return true;
  }

  disconnect() {
    if (!this.rdpConnection) {
      return;
    }
    this.rdpConnection.close();
    this.rejectAllRequests(new Error("RDP connection close"));
  }

  rejectAllRequests(error: Error) {
    for (const activeDeferred of this.active.values()) {
      activeDeferred.reject(error);
    }
    this.active.clear();

    for (const { deferred } of this.pending) {
      deferred.reject(error);
    }
    this.pending = [];
  }

  handleMessage(rdpData: RDPData) {
    if (rdpData.from == null) {
      if (rdpData.error) {
        this.emit("rdp-error", rdpData);
        return;
      }

      this.emit(
        "error",
        new Error(
          `Received an RDP message without a sender actor: ${
            JSON.stringify(
              rdpData,
            )
          }`,
        ),
      );
      return;
    }

    if (UNSOLICITED_EVENTS.has(rdpData.type)) {
      this.emit("unsolicited-event", rdpData);
      return;
    }

    if (this.active.has(rdpData.from)) {
      const deferred = this.active.get(rdpData.from);
      this.active.delete(rdpData.from);
      if (rdpData.error) {
        deferred?.reject(rdpData);
      } else {
        deferred?.resolve(rdpData);
      }
      this.flushPendingRequests();
      return;
    }

    this.emit(
      "error",
      new Error(`Unexpected RDP message received: ${JSON.stringify(rdpData)}`),
    );
  }

  async connect(port: number): Promise<RDPData> {
    let client;
    try {
      client = await Deno.connect({
        transport: "tcp",
        port,
      });
    } catch (_) {
      throw new Error(
        `Failed to connect to port :${port}, maybe need to wait for some minutes`,
      );
    }
    this.rdpConnection = client;
    return new Promise((resolve, reject) => {
      (async () => {
        this.expectReply("root", { resolve, reject });
        const buffer = new Uint8Array(1024);
        try {
          while (true) {
            const n = await this.rdpConnection?.read(buffer);
            if (!n) {
              break;
            }
            if (n == null) {
              this.rdpConnection = undefined;
              log.info("Connection closed by server");
              this.onEnd();
              return;
            }
            const receivedMessage = buffer.subarray(0, n);
            this.onData(receivedMessage);
          }
        } catch (error) {
          log.error("Error:", error);
          this.onError(error as Error);
        } finally {
          this.rdpConnection?.close();
        }
      })();
    });
  }

  expectReply(
    targetActor: string,
    deferred: Deferred,
  ) {
    if (this.active.has(targetActor)) {
      throw new Error(`${targetActor} does already have an active request`);
    }
    this.active.set(targetActor, deferred);
  }

  request(requestProps: RDPRequest | string): Promise<RDPData> {
    let request: RDPRequest;

    if (typeof requestProps === "string") {
      request = { to: "root", type: requestProps };
    } else {
      request = requestProps;
    }

    if (request.to == null) {
      throw new Error(
        `Unexpected RDP request without target actor: ${request.type}`,
      );
    }
    return new Promise((resolve, reject) => {
      const deferred = { resolve, reject };
      this.pending.push({ request, deferred });
      this.flushPendingRequests();
    });
  }

  private flushPendingRequests() {
    this.pending = this.pending.filter(({ request, deferred }) => {
      if (this.active.has(request.to)) {
        // Keep in the pending requests until there are no requests
        // active on the target RDP actor.
        return true;
      }

      const conn = this.rdpConnection;
      if (!conn) {
        throw new Error("RDP connection closed");
      }
      try {
        let str = JSON.stringify(request);
        const encoder = new TextEncoder();
        const buffer = encoder.encode(str);
        str = `${buffer.length}:${str}`;
        const data = encoder.encode(str);
        this.rdpConnection?.write(data);
        this.expectReply(request.to, deferred);
      } catch (err) {
        deferred.reject(err);
      }
    });
  }
}
