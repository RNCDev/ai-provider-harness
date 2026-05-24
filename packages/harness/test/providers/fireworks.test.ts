import { afterEach, describe, expect, it, vi } from "vitest";
import { fireworksProvider } from "../../src/providers/fireworks.js";

afterEach(() => vi.restoreAllMocks());

const fixture = 'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: {"choices":[{"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
function streamRes(s: string) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }), { status: 200 });
}

describe("fireworksProvider", () => {
  it("streams via /chat/completions", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamRes(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const out = [];
    for await (const c of fireworksProvider.chat({ modelId: "accounts/fireworks/models/llama-v3-8b-instruct", messages: [{ role: "user", content: "hi" }] }, "fw-key")) out.push(c);
    expect(out[0]?.type).toBe("text");
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("fireworks.ai/inference/v1/chat/completions");
  });
});
