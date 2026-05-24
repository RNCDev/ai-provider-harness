import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphNext } from "../src/server/next.js";

function harness() {
  return createHarness({
    storage: new MemoryStorageAdapter(),
    providers: {
      fake: {
        id: "fake", displayName: "Fake",
        async listModels() { return []; },
        async validateKey() { return { ok: true }; },
        async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
      },
    },
    identify: (req) => (req as Request).headers.get("x-user") ?? "anon",
  });
}

describe("aphNext", () => {
  it("GET /aph/models", async () => {
    const { GET } = aphNext(harness());
    const res = await GET(new Request("http://x/aph/models", { headers: { "x-user": "u1" } }), { params: { path: ["models"] } });
    const body = await res.json();
    expect(body.providers[0].id).toBe("fake");
  });

  it("PUT then GET /aph/config round-trips", async () => {
    const h = harness();
    const { PUT, GET } = aphNext(h);
    await PUT(new Request("http://x/aph/config", { method: "PUT", headers: { "x-user": "u1", "content-type": "application/json" }, body: JSON.stringify({ selection: { providerId: "fake", modelId: "m1" } }) }), { params: { path: ["config"] } });
    const res = await GET(new Request("http://x/aph/config", { headers: { "x-user": "u1" } }), { params: { path: ["config"] } });
    expect((await res.json()).selection.modelId).toBe("m1");
  });

  it("POST /aph/chat streams SSE", async () => {
    const h = harness();
    const { PUT, POST } = aphNext(h);
    await PUT(new Request("http://x/aph/keys/fake", { method: "PUT", headers: { "x-user": "u1", "content-type": "application/json" }, body: JSON.stringify({ key: "secret" }) }), { params: { path: ["keys", "fake"] } });
    const res = await POST(
      new Request("http://x/aph/chat?provider=fake", { method: "POST", headers: { "x-user": "u1", "content-type": "application/json" }, body: JSON.stringify({ modelId: "m1", messages: [{ role: "user", content: "hi" }] }) }),
      { params: { path: ["chat"] } },
    );
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("data: {");
  });
});
