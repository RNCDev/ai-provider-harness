import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphExpress } from "../src/server/express.js";
import { OpenAIProvider } from "../src/providers/openai.js";

const sseFixture = [
  'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
  'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
  "data: [DONE]\n\n",
].join("");

function streamRes() {
  const enc = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(sseFixture)); c.close(); } }), { status: 200 });
}

afterEach(() => vi.restoreAllMocks());

describe("integration: express + openai", () => {
  it("set key → put config → chat streams from provider", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamRes()));
    const harness = createHarness({
      storage: new MemoryStorageAdapter(),
      providers: { openai: new OpenAIProvider() },
      identify: (req) => (req as express.Request).header("x-user") ?? "anon",
    });
    const app = express();
    app.use(express.json());
    app.use("/aph", aphExpress(harness));

    await request(app).put("/aph/keys/openai").set("x-user", "u1").send({ key: "sk" }).expect(200);
    await request(app).put("/aph/config").set("x-user", "u1").send({
      selection: { providerId: "openai", modelId: "gpt-4o" },
      settings: { "gpt-4o": { temperature: 0.5, maxTokens: 100 } },
    }).expect(200);

    const res = await request(app)
      .post("/aph/chat?provider=openai")
      .set("x-user", "u1")
      .send({ modelId: "gpt-4o", messages: [{ role: "user", content: "say hi" }] });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"text":"Hello"');
    expect(res.text).toContain('"text":" world"');
    expect(res.text).toContain('"type":"finish"');
  });
});
