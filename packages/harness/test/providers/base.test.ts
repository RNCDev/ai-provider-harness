import { describe, expect, it } from "vitest";
import { parseSseLines } from "../../src/providers/base.js";

describe("parseSseLines", () => {
  it("yields data lines, skips blanks and comments", async () => {
    const enc = new TextEncoder();
    const chunks = [
      "data: {\"a\":1}\n\n",
      ": ping\n",
      "data: {\"a\":2}\n",
      "\n",
      "data: [DONE]\n\n",
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (const s of chunks) c.enqueue(enc.encode(s));
        c.close();
      },
    });
    const seen: string[] = [];
    for await (const line of parseSseLines(stream)) seen.push(line);
    expect(seen).toEqual(['{"a":1}', '{"a":2}', "[DONE]"]);
  });

  it("handles data split across chunks", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode("data: {\"a\""));
        c.enqueue(enc.encode(":1}\n\n"));
        c.close();
      },
    });
    const seen: string[] = [];
    for await (const line of parseSseLines(stream)) seen.push(line);
    expect(seen).toEqual(['{"a":1}']);
  });
});
