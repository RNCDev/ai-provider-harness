import "fake-indexeddb/auto";

// Node 22+ ships a built-in localStorage stub that vitest's jsdom environment cannot override
// via its normal populateGlobal mechanism. Detect the jsdom environment by probing globalThis.jsdom
// (set by vitest's jsdom runner) and redirect localStorage to jsdom's own window.localStorage.
const g = globalThis as Record<string, unknown>;
if (g.jsdom && typeof g.jsdom === "object" && (g.jsdom as Record<string, unknown>).window) {
  const jsdomWindow = (g.jsdom as Record<string, unknown>).window as { localStorage: Storage };
  const jsdomStorage = jsdomWindow.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => jsdomStorage,
  });
}
