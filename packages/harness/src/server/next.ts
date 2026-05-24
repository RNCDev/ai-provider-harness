import type { Harness } from "./index.js";

type Ctx = { params: { path: string[] } };
type RouteHandler = (req: Request, ctx: Ctx) => Promise<Response>;

export function aphNext(harness: Harness): { GET: RouteHandler; POST: RouteHandler; PUT: RouteHandler; DELETE: RouteHandler } {
  async function ownerOf(req: Request) {
    return harness.identify(req);
  }
  async function route(req: Request, ctx: Ctx): Promise<Response> {
    const path = ctx.params.path;
    const head = path[0];
    const sub = path[1];
    const url = new URL(req.url);
    try {
      if (head === "models" && req.method === "GET") {
        return Response.json(await harness.handlers.listModels());
      }
      if (head === "config" && req.method === "GET") {
        return Response.json(await harness.handlers.getConfig(await ownerOf(req)));
      }
      if (head === "config" && req.method === "PUT") {
        const body = await req.json();
        return Response.json(await harness.handlers.putConfig(await ownerOf(req), body));
      }
      if (head === "keys" && sub) {
        if (req.method === "PUT") {
          const { key } = (await req.json()) as { key?: string };
          if (!key) return Response.json({ error: "missing key" }, { status: 400 });
          return Response.json(await harness.handlers.putKey(await ownerOf(req), sub, key));
        }
        if (req.method === "DELETE") return Response.json(await harness.handlers.deleteKey(await ownerOf(req), sub));
        if (req.method === "GET") return Response.json(await harness.handlers.keyStatus(await ownerOf(req), sub));
        if (req.method === "POST" && path[2] === "validate") {
          return Response.json(await harness.handlers.validateKey(await ownerOf(req), sub));
        }
      }
      if (head === "chat" && req.method === "POST") {
        const providerId = url.searchParams.get("provider");
        if (!providerId) return Response.json({ error: "missing ?provider" }, { status: 400 });
        const body = await req.json();
        const owner = await ownerOf(req);
        const enc = new TextEncoder();
        const stream = new ReadableStream({
          async start(c) {
            for await (const chunk of harness.handlers.chat(owner, body, providerId)) {
              c.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            c.close();
          },
        });
        return new Response(stream, {
          headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
        });
      }
      return Response.json({ error: "not found" }, { status: 404 });
    } catch (e) {
      return Response.json({ error: String((e as Error).message ?? e) }, { status: 500 });
    }
  }
  return { GET: route, POST: route, PUT: route, DELETE: route };
}
