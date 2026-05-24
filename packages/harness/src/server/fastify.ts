import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import type { Harness } from "./index.js";

export interface AphFastifyOpts { harness: Harness; prefix?: string }

export const aphFastify: FastifyPluginAsync<AphFastifyOpts> = async (app: FastifyInstance, opts) => {
  const h = opts.harness;
  const owner = (req: { headers: Record<string, string | string[] | undefined> }) =>
    Promise.resolve(h.identify(req));

  app.get("/models", async () => h.handlers.listModels());
  app.get("/config", async (req) => h.handlers.getConfig(await owner(req)));
  app.put("/config", async (req) => h.handlers.putConfig(await owner(req), req.body as Record<string, unknown>));
  app.get("/keys/:provider", async (req) => h.handlers.keyStatus(await owner(req), (req.params as { provider: string }).provider));
  app.put("/keys/:provider", async (req, reply) => {
    const { key } = (req.body ?? {}) as { key?: string };
    if (!key) return reply.code(400).send({ error: "missing key" });
    return h.handlers.putKey(await owner(req), (req.params as { provider: string }).provider, key);
  });
  app.delete("/keys/:provider", async (req) => h.handlers.deleteKey(await owner(req), (req.params as { provider: string }).provider));
  app.post("/keys/:provider/validate", async (req) => h.handlers.validateKey(await owner(req), (req.params as { provider: string }).provider));
  app.post("/chat", async (req, reply) => {
    const providerId = String((req.query as Record<string, string>)["provider"] ?? "");
    if (!providerId) return reply.code(400).send({ error: "missing ?provider" });
    const body = req.body as { messages?: unknown };
    if (!Array.isArray(body.messages)) return reply.code(400).send({ error: "messages must be an array" });
    reply.raw.setHeader("content-type", "text/event-stream");
    reply.raw.setHeader("cache-control", "no-cache");
    reply.hijack();
    try {
      for await (const c of h.handlers.chat(await owner(req), req.body as Parameters<typeof h.handlers.chat>[1], providerId)) {
        reply.raw.write(`data: ${JSON.stringify(c)}\n\n`);
      }
    } catch (e) {
      reply.raw.write(`data: ${JSON.stringify({ type: "error", error: String(e) })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });
};
