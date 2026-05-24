import { afterEach, describe, expect, it, vi } from "vitest";
import { openrouterProvider } from "../../src/providers/openrouter.js";

afterEach(() => vi.restoreAllMocks());

const fixture = 'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: {"choices":[{"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
function streamRes(s: string) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }), { status: 200 });
}

describe("openrouterProvider", () => {
  it("streams via /chat/completions", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamRes(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const out = [];
    for await (const c of openrouterProvider.chat({ modelId: "anthropic/claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }] }, "or-key")) out.push(c);
    expect(out[0]?.type).toBe("text");
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("openrouter.ai/api/v1/chat/completions");
  });
});
