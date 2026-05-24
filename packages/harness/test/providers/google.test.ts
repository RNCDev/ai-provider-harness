import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleProvider } from "../../src/providers/google.js";

afterEach(() => vi.restoreAllMocks());

const fixture = [
  'data: {"candidates":[{"content":{"parts":[{"text":"Hel"}]}}]}\n\n',
  'data: {"candidates":[{"content":{"parts":[{"text":"lo"}]}}]}\n\n',
  'data: {"candidates":[{"finishReason":"STOP"}]}\n\n',
].join("");

function streamFromString(s: string) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }),
    { status: 200 },
  );
}

describe("GoogleProvider", () => {
  it("streams parts then finish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamFromString(fixture)));
    const p = new GoogleProvider();
    const out = [];
    for await (const c of p.chat({ modelId: "gemini-1.5-pro", messages: [{ role: "user", content: "hi" }] }, "AIza")) {
      out.push(c);
    }
    expect(out.filter((c) => c.type === "text").map((c) => c.type === "text" ? c.text : "").join("")).toBe("Hello");
    expect(out.at(-1)?.type).toBe("finish");
  });

  it("passes key via x-goog-api-key header", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamFromString(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const p = new GoogleProvider();
    for await (const _ of p.chat({ modelId: "gemini-1.5-pro", messages: [{ role: "user", content: "hi" }] }, "AIza-x")) { /* drain */ }
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/models/gemini-1.5-pro:streamGenerateContent");
    expect((init as RequestInit).headers).toMatchObject({ "x-goog-api-key": "AIza-x" });
  });
});
