import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicProvider } from "../../src/providers/anthropic.js";

const fixture = readFileSync(join(import.meta.dirname, "../fixtures/anthropic-stream.txt"), "utf8");

afterEach(() => vi.restoreAllMocks());

function streamFromString(s: string) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }),
    { status: 200 },
  );
}

describe("AnthropicProvider", () => {
  it("streams text deltas then finish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamFromString(fixture)));
    const p = new AnthropicProvider();
    const chunks = [];
    for await (const c of p.chat(
      { modelId: "claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }], settings: { maxTokens: 100 } },
      "sk-ant",
    )) {
      chunks.push(c);
    }
    expect(chunks.filter((c) => c.type === "text").map((c) => c.type === "text" ? c.text : "").join("")).toBe("Hi there");
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("uses x-api-key + anthropic-version headers", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamFromString(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const p = new AnthropicProvider();
    for await (const _ of p.chat(
      { modelId: "claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }], settings: { maxTokens: 100 } },
      "sk-ant",
    )) { /* drain */ }
    const [, init] = fetchSpy.mock.calls[0]!;
    const h = (init as RequestInit).headers as Record<string, string>;
    expect(h["x-api-key"]).toBe("sk-ant");
    expect(h["anthropic-version"]).toBeDefined();
  });

  it("errors clearly if maxTokens missing", async () => {
    const p = new AnthropicProvider();
    const out = [];
    for await (const c of p.chat({ modelId: "claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }] }, "sk-ant")) {
      out.push(c);
    }
    expect(out[0]?.type).toBe("error");
    expect(out[0]?.type === "error" ? out[0]?.error : "").toMatch(/maxTokens/i);
  });
});
