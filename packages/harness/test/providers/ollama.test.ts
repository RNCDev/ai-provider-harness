import { afterEach, describe, expect, it, vi } from "vitest";
import { ollamaProvider } from "../../src/providers/ollama.js";

afterEach(() => vi.restoreAllMocks());

const fixture = 'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: {"choices":[{"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
function streamRes(s: string) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }), { status: 200 });
}

describe("ollamaProvider", () => {
  it("streams via /chat/completions with no Authorization header", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamRes(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const out = [];
    for await (const c of ollamaProvider.chat({ modelId: "llama3", messages: [{ role: "user", content: "hi" }] }, "")) out.push(c);
    expect(out[0]?.type).toBe("text");
    const url = String(fetchSpy.mock.calls[0]![0]);
    expect(url).toContain("localhost:11434/v1/chat/completions");
    const headers = fetchSpy.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });
});
