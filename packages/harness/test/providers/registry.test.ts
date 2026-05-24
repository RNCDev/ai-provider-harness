import { describe, expect, it } from "vitest";
import { defaultProviders, ProviderRegistry } from "../../src/providers/registry.js";

describe("defaultProviders", () => {
  it("exposes 9 providers", () => {
    expect(Object.keys(defaultProviders)).toHaveLength(9);
    expect(defaultProviders["openai"]).toBeDefined();
    expect(defaultProviders["ollama"]).toBeDefined();
  });
});

describe("ProviderRegistry", () => {
  it("returns provider by id", () => {
    const r = new ProviderRegistry(defaultProviders);
    expect(r.get("openai")?.id).toBe("openai");
    expect(r.get("nope")).toBeUndefined();
  });
  it("lists ids", () => {
    expect(new ProviderRegistry(defaultProviders).ids().length).toBe(9);
  });
});
