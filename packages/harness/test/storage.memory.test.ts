import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";

describe("MemoryStorageAdapter", () => {
  it("round-trips config", async () => {
    const s = new MemoryStorageAdapter();
    await s.setConfig("u1", { selection: { providerId: "openai", modelId: "gpt-4o" } });
    const cfg = await s.getConfig("u1");
    expect(cfg.selection?.providerId).toBe("openai");
  });

  it("returns empty config for unknown owner", async () => {
    const s = new MemoryStorageAdapter();
    expect(await s.getConfig("nobody")).toEqual({});
  });

  it("stores and reports key presence without leaking value via hasKey", async () => {
    const s = new MemoryStorageAdapter();
    await s.setKey("u1", "openai", "sk-test");
    expect(await s.hasKey("u1", "openai")).toBe(true);
    expect(await s.getKey("u1", "openai")).toBe("sk-test");
  });

  it("deleteKey removes a key", async () => {
    const s = new MemoryStorageAdapter();
    await s.setKey("u1", "openai", "sk-test");
    await s.deleteKey("u1", "openai");
    expect(await s.hasKey("u1", "openai")).toBe(false);
  });

  it("isolates owners", async () => {
    const s = new MemoryStorageAdapter();
    await s.setKey("u1", "openai", "a");
    await s.setKey("u2", "openai", "b");
    expect(await s.getKey("u1", "openai")).toBe("a");
    expect(await s.getKey("u2", "openai")).toBe("b");
  });
});
