import { afterEach, describe, expect, it, vi } from "vitest";
import { ServerTransport } from "../src/context/transport.js";

afterEach(() => vi.restoreAllMocks());

describe("ServerTransport", () => {
  it("calls GET /aph/models", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ providers: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const t = new ServerTransport({ baseUrl: "/api/aph" });
    await t.listModels();
    expect(String(fetchSpy.mock.calls[0]![0])).toBe("/api/aph/models");
  });

  it("posts key to PUT /aph/keys/:provider", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({ hasKey: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
    const t = new ServerTransport({ baseUrl: "/api/aph" });
    await t.putKey("openai", "sk");
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toBe("/api/aph/keys/openai");
    expect((init as RequestInit).method).toBe("PUT");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ key: "sk" });
  });

  it("chat consumes SSE and yields parsed chunks", async () => {
    const enc = new TextEncoder();
    const sse = 'data: {"type":"text","text":"hi"}\n\ndata: {"type":"finish","finishReason":"stop"}\n\n';
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(sse)); c.close(); } });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } })));
    const t = new ServerTransport({ baseUrl: "/api/aph" });
    const seen = [];
    for await (const c of t.chat("openai", { modelId: "m", messages: [{ role: "user", content: "hi" }] })) seen.push(c);
    expect(seen.map((c) => c.type)).toEqual(["text", "finish"]);
    expect(seen[0]?.text).toBe("hi");
  });
});
