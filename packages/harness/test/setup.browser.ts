import "fake-indexeddb/auto";

// Node 22+ has a built-in localStorage that conflicts with jsdom's.
// When running in jsdom environment, replace the Node built-in with jsdom's.
if (typeof (globalThis as any).jsdom !== "undefined") {
  const jsdomWindow = (globalThis as any).jsdom.window;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => jsdomWindow.localStorage,
  });
}
