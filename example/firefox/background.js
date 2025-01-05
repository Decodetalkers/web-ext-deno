// https://jsr.io/@bpev/bext/1.3.0/source/utilities/predicates.ts
var BrowserType = /* @__PURE__ */ ((BrowserType2) => {
  BrowserType2["DENO"] = "DENO";
  BrowserType2["CHROME"] = "CHROME";
  BrowserType2["FIREFOX"] = "FIREFOX";
  return BrowserType2;
})(BrowserType || {});
var { CHROME, DENO, FIREFOX } = BrowserType;
function isBrowser(toCheck) {
  let currentBrowser = CHROME;
  try {
    const userAgent = navigator?.userAgent || "";
    if (/firefox/i.test(userAgent)) {
      currentBrowser = FIREFOX;
    } else if (/deno/i.test(userAgent)) {
      currentBrowser = DENO;
    }
  } catch (_) {
  }
  if (!toCheck) currentBrowser;
  if (toCheck === CHROME && currentBrowser === CHROME) return true;
  if (toCheck === FIREFOX && currentBrowser === FIREFOX) return true;
  if (toCheck === DENO && currentBrowser === DENO) return true;
  return false;
}
function isDeno() {
  return isBrowser(DENO);
}
function isFirefox() {
  return isBrowser(FIREFOX);
}

// https://jsr.io/@bpev/bext/1.3.0/source/mock_browser/main.ts
var listeners = {
  addListener: () => {
  },
  removeListener: () => {
  },
  hasListener: () => {
  }
};
var main_default = {
  permissions: {
    contains: () => {
    },
    request: () => {
    }
  },
  runtime: {
    onMessage: listeners,
    openOptionsPage: () => {
    },
    lastError: {
      message: ""
    }
  },
  storage: {
    sync: {
      get: () => {
      },
      set: () => {
      }
    }
  },
  tabs: {
    onUpdated: listeners,
    query: () => {
    },
    sendMessage: () => {
    }
  }
};

// https://jsr.io/@bpev/bext/1.3.0/source/mod.ts
var browserAPI = globalThis.chrome;
if (isFirefox()) {
  browserAPI = globalThis.browser;
}
if (isDeno()) {
  browserAPI = main_default;
}
var mod_default = browserAPI;

// source/background.ts
mod_default.tabs.onUpdated.addListener(() => {
  console.log("tab-updated");
});
