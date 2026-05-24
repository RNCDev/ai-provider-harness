// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { BrowserStorageAdapter } from "../src/storage/browser.js";

afterEach(() => {
  window.localStorage.clear();
});

describe("BrowserStorageAdapter", () => {
  it("persists config to localStorage", async () => {
    const s = new BrowserStorageAdapter();
    await s.setConfig("u1", { selection: { providerId: "openai", modelId: "gpt-4o" } });
    const fresh = new BrowserStorageAdapter();
    expect((await fresh.getConfig("u1")).selection?.modelId).toBe("gpt-4o");
  });

  it("persists keys via IndexedDB", async () => {
    const s = new BrowserStorageAdapter();
    await s.setKey("u1", "openai", "sk-browser");
    const fresh = new BrowserStorageAdapter();
    expect(await fresh.getKey("u1", "openai")).toBe("sk-browser");
  });

  it("hasKey is true after setKey", async () => {
    const s = new BrowserStorageAdapter();
    await s.setKey("u1", "anthropic", "sk-a");
    expect(await s.hasKey("u1", "anthropic")).toBe(true);
  });

  it("deleteKey removes key from IndexedDB", async () => {
    const s = new BrowserStorageAdapter();
    await s.setKey("u1", "openai", "sk-del");
    await s.deleteKey("u1", "openai");
    expect(await s.hasKey("u1", "openai")).toBe(false);
  });
});
