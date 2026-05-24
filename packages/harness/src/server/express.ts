import type { RequestHandler, Router } from "express";
import { Router as makeRouter } from "express";
import type { Harness } from "./index.js";

export function aphExpress(harness: Harness): Router {
  const r = makeRouter();
  const owner = async (req: Parameters<RequestHandler>[0]) => harness.identify(req);

  r.get("/models", async (_req, res, next) => {
    try { res.json(await harness.handlers.listModels()); } catch (e) { next(e); }
  });
  r.get("/config", async (req, res, next) => {
    try { res.json(await harness.handlers.getConfig(await owner(req))); } catch (e) { next(e); }
  });
  r.put("/config", async (req, res, next) => {
    try { res.json(await harness.handlers.putConfig(await owner(req), req.body)); } catch (e) { next(e); }
  });
  r.put("/keys/:provider", async (req, res, next) => {
    try {
      const { key } = req.body as { key?: string };
      if (!key) { res.status(400).json({ error: "missing key" }); return; }
      res.json(await harness.handlers.putKey(await owner(req), req.params["provider"]!, key));
    } catch (e) { next(e); }
  });
  r.delete("/keys/:provider", async (req, res, next) => {
    try { res.json(await harness.handlers.deleteKey(await owner(req), req.params["provider"]!)); } catch (e) { next(e); }
  });
  r.get("/keys/:provider", async (req, res, next) => {
    try { res.json(await harness.handlers.keyStatus(await owner(req), req.params["provider"]!)); } catch (e) { next(e); }
  });
  r.post("/keys/:provider/validate", async (req, res, next) => {
    try { res.json(await harness.handlers.validateKey(await owner(req), req.params["provider"]!)); } catch (e) { next(e); }
  });
  r.post("/chat", async (req, res, next) => {
    try {
      const providerId = String(req.query["provider"] ?? "");
      if (!providerId) { res.status(400).json({ error: "missing ?provider" }); return; }
      res.setHeader("content-type", "text/event-stream");
      res.setHeader("cache-control", "no-cache");
      res.setHeader("connection", "keep-alive");
      for await (const chunk of harness.handlers.chat(await owner(req), req.body, providerId)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.end();
    } catch (e) { next(e); }
  });
  return r;
}
