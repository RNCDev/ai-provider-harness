import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphExpress } from "../src/server/express.js";
import type { Provider } from "../src/types.js";

function fake(): Provider {
  return {
    id: "fake", displayName: "Fake",
    async listModels() { return []; },
    async validateKey() { return { ok: true }; },
    async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
  };
}

function makeApp() {
  const harness = createHarness({
    storage: new MemoryStorageAdapter(),
    providers: { fake: fake() },
    identify: (req) => (req as express.Request).header("x-user") ?? "anon",
  });
  const app = express();
  app.use(express.json());
  app.use("/aph", aphExpress(harness));
  return app;
}

describe("aphExpress", () => {
  it("GET /aph/models returns provider list", async () => {
    const res = await request(makeApp()).get("/aph/models").set("x-user", "u1");
    expect(res.status).toBe(200);
    expect(res.body.providers[0].id).toBe("fake");
  });

  it("PUT /aph/config persists then GET returns it", async () => {
    const app = makeApp();
    await request(app).put("/aph/config").set("x-user", "u1").send({ selection: { providerId: "fake", modelId: "m1" } }).expect(200);
    const r = await request(app).get("/aph/config").set("x-user", "u1");
    expect(r.body.selection.modelId).toBe("m1");
  });

  it("PUT /aph/keys/:provider stores key (write-only)", async () => {
    const app = makeApp();
    const r = await request(app).put("/aph/keys/fake").set("x-user", "u1").send({ key: "secret" });
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ hasKey: true });
  });

  it("POST /aph/chat streams SSE", async () => {
    const app = makeApp();
    await request(app).put("/aph/keys/fake").set("x-user", "u1").send({ key: "secret" });
    const res = await request(app)
      .post("/aph/chat?provider=fake")
      .set("x-user", "u1")
      .send({ modelId: "m1", messages: [{ role: "user", content: "hi" }] });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.text).toContain("data: {");
  });
});
