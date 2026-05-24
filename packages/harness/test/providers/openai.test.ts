import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIProvider } from "../../src/providers/openai.js";

const fixture = readFileSync(join(import.meta.dirname, "../fixtures/openai-stream.txt"), "utf8");

afterEach(() => vi.restoreAllMocks());

function streamFromString(s: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(enc.encode(s));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
}

describe("OpenAIProvider", () => {
  it("streams text chunks then finish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamFromString(fixture)));
    const p = new OpenAIProvider();
    const chunks = [];
    for await (const c of p.chat({ modelId: "gpt-4o", messages: [{ role: "user", content: "hi" }] }, "sk")) {
      chunks.push(c);
    }
    expect(chunks.filter((c) => c.type === "text").map((c) => c.type === "text" ? c.text : "").join("")).toBe("Hello world");
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("validateKey returns ok:true on 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    const p = new OpenAIProvider();
    expect((await p.validateKey("sk")).ok).toBe(true);
  });

  it("validateKey returns ok:false on 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })));
    const p = new OpenAIProvider();
    const r = await p.validateKey("bad");
    expect(r.ok).toBe(false);
  });

  it("sends Authorization header and request body", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamFromString(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const p = new OpenAIProvider();
    const iter = p.chat({ modelId: "gpt-4o", messages: [{ role: "user", content: "hi" }], settings: { temperature: 0.7 } }, "sk-abc");
    for await (const _ of iter) { /* drain */ }
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer sk-abc" });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe("gpt-4o");
    expect(body.temperature).toBe(0.7);
    expect(body.stream).toBe(true);
  });
});
