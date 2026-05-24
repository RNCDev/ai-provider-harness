import { describe, expect, it, vi, beforeEach } from "vitest";
import { Catalog } from "../src/catalog/modelsdev.js";

describe("Catalog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns fallback snapshot when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const c = new Catalog({ store: new Map() });
    const models = await c.listModels("openai");
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]?.providerId).toBe("openai");
  });

  it("uses cached value within ttl", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: { openai: { models: [{ id: "x", displayName: "X", capabilities: { streaming: true, tools: false, vision: false, reasoning: false } }] } } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const store = new Map();
    const c = new Catalog({ store, ttlMs: 60_000 });
    await c.listModels("openai");
    await c.listModels("openai");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after ttl expires", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: { openai: { models: [] } } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const store = new Map();
    const c = new Catalog({ store, ttlMs: 1, now: () => Date.now() });
    await c.listModels("openai");
    await new Promise((r) => setTimeout(r, 5));
    await c.listModels("openai");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("emits warning event when fetch fails but cache exists", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error("502"));
    vi.stubGlobal("fetch", fetchSpy);
    const store = new Map();
    const c = new Catalog({ store, ttlMs: 1 });
    const warnings: unknown[] = [];
    c.on("warning", (w) => warnings.push(w));
    await c.listModels("openai");
    await new Promise((r) => setTimeout(r, 5));
    await c.listModels("openai");
    expect(warnings.length).toBeGreaterThan(0);
  });
});
