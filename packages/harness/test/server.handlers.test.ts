import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { Catalog } from "../src/catalog/modelsdev.js";
import { ProviderRegistry } from "../src/providers/registry.js";
import { createHandlers } from "../src/server/handlers.js";
import type { Provider } from "../src/types.js";

function fakeProvider(id = "fake"): Provider {
  return {
    id,
    displayName: id,
    async listModels() { return [{ id: "m1", providerId: id, displayName: "M1", capabilities: { streaming: true, tools: false, vision: false, reasoning: false } }]; },
    async validateKey(k) { return { ok: k === "good" }; },
    async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
  };
}

describe("handlers", () => {
  const setup = () => {
    const storage = new MemoryStorageAdapter();
    const registry = new ProviderRegistry({ fake: fakeProvider() });
    const catalog = new Catalog({ store: new Map() });
    return createHandlers({ storage, registry, catalog });
  };

  it("config: empty for new owner", async () => {
    const h = setup();
    const r = await h.getConfig("u1");
    expect(r).toEqual({});
  });

  it("config: round-trip", async () => {
    const h = setup();
    await h.putConfig("u1", { selection: { providerId: "fake", modelId: "m1" } });
    expect((await h.getConfig("u1")).selection?.modelId).toBe("m1");
  });

  it("keys: set + hasKey", async () => {
    const h = setup();
    await h.putKey("u1", "fake", "good");
    expect(await h.keyStatus("u1", "fake")).toEqual({ hasKey: true });
  });

  it("keys: validate returns ok with stored key", async () => {
    const h = setup();
    await h.putKey("u1", "fake", "good");
    expect((await h.validateKey("u1", "fake")).ok).toBe(true);
  });

  it("keys: validate fails for unknown provider", async () => {
    const h = setup();
    await expect(h.validateKey("u1", "nope")).rejects.toThrow(/unknown provider/);
  });

  it("chat: streams chunks", async () => {
    const h = setup();
    await h.putKey("u1", "fake", "good");
    const out = [];
    for await (const c of h.chat("u1", { modelId: "m1", messages: [{ role: "user", content: "hi" }] }, "fake")) out.push(c);
    expect(out.map((c) => c.type)).toEqual(["text", "finish"]);
  });

  it("chat: errors if no key", async () => {
    const h = setup();
    const out = [];
    for await (const c of h.chat("u1", { modelId: "m1", messages: [{ role: "user", content: "hi" }] }, "fake")) out.push(c);
    expect(out[0]?.type).toBe("error");
  });
});
