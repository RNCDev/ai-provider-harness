import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphFastify } from "../src/server/fastify.js";

async function makeApp() {
  const app = Fastify();
  const harness = createHarness({
    storage: new MemoryStorageAdapter(),
    providers: {
      fake: {
        id: "fake", displayName: "Fake",
        async listModels() { return []; },
        async validateKey() { return { ok: true }; },
        async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
      },
    },
    identify: (req) => ((req as { headers: Record<string, string> }).headers["x-user"] ?? "anon"),
  });
  await app.register(aphFastify, { harness, prefix: "/aph" });
  return app;
}

describe("aphFastify", () => {
  it("GET /aph/models works", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/aph/models", headers: { "x-user": "u1" } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).providers[0].id).toBe("fake");
  });
  it("PUT /aph/keys/:provider stores key", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "PUT", url: "/aph/keys/fake", headers: { "x-user": "u1", "content-type": "application/json" }, payload: JSON.stringify({ key: "k" }) });
    expect(JSON.parse(res.body)).toEqual({ hasKey: true });
  });
});
