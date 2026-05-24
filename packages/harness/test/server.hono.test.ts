import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphHono } from "../src/server/hono.js";

function makeApp() {
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
    identify: (req) => ((req as Request).headers.get("x-user") ?? "anon"),
  });
  const app = new Hono();
  app.route("/aph", aphHono(harness));
  return app;
}

describe("aphHono", () => {
  it("GET /aph/models", async () => {
    const res = await makeApp().request("/aph/models", { headers: { "x-user": "u1" } });
    expect(res.status).toBe(200);
    expect((await res.json()).providers[0].id).toBe("fake");
  });
  it("PUT /aph/keys/:provider", async () => {
    const res = await makeApp().request("/aph/keys/fake", {
      method: "PUT",
      headers: { "x-user": "u1", "content-type": "application/json" },
      body: JSON.stringify({ key: "k" }),
    });
    expect(await res.json()).toEqual({ hasKey: true });
  });
});
