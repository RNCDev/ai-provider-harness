import { Hono } from "hono";
import type { Harness } from "./index.js";

export function aphHono(harness: Harness): Hono {
  const app = new Hono();
  const owner = (req: Request) => Promise.resolve(harness.identify(req));

  app.get("/models", async (c) => c.json(await harness.handlers.listModels()));
  app.get("/config", async (c) => c.json(await harness.handlers.getConfig(await owner(c.req.raw))));
  app.put("/config", async (c) => c.json(await harness.handlers.putConfig(await owner(c.req.raw), await c.req.json())));
  app.get("/keys/:provider", async (c) => c.json(await harness.handlers.keyStatus(await owner(c.req.raw), c.req.param("provider"))));
  app.put("/keys/:provider", async (c) => {
    let parsed: { key?: string };
    try {
      parsed = (await c.req.json()) as { key?: string };
    } catch {
      return c.json({ error: "invalid JSON body" }, 400);
    }
    const { key } = parsed;
    if (!key) return c.json({ error: "missing key" }, 400);
    return c.json(await harness.handlers.putKey(await owner(c.req.raw), c.req.param("provider"), key));
  });
  app.delete("/keys/:provider", async (c) => c.json(await harness.handlers.deleteKey(await owner(c.req.raw), c.req.param("provider"))));
  app.post("/keys/:provider/validate", async (c) => c.json(await harness.handlers.validateKey(await owner(c.req.raw), c.req.param("provider"))));
  app.post("/chat", async (c) => {
    const providerId = c.req.query("provider");
    if (!providerId) return c.json({ error: "missing ?provider" }, 400);
    const body = await c.req.json() as { messages?: unknown };
    if (!Array.isArray(body.messages)) return c.json({ error: "messages must be an array" }, 400);
    const ownerId = await owner(c.req.raw);
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of harness.handlers.chat(ownerId, body as Parameters<typeof harness.handlers.chat>[1], providerId)) {
            controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
        } catch (e) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", error: String(e) })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
  });
  return app;
}
