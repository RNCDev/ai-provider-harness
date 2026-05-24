import type { Catalog, ChatChunk, ChatRequest, HarnessConfig, Provider, ProviderId, StorageAdapter } from "@aph/harness";
import type { ModelsResponse, Transport } from "./types.js";

async function* parseSseLines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).replace(/\r$/, "");
        buf = buf.slice(idx + 1);
        if (line.startsWith("data: ")) yield line.slice(6);
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export interface ServerTransportOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
  headers?: () => Record<string, string>;
}

export class ServerTransport implements Transport {
  private base: string;
  private fetcher: typeof fetch;
  private hdrs: () => Record<string, string>;
  constructor(opts: ServerTransportOptions = {}) {
    this.base = (opts.baseUrl ?? "/aph").replace(/\/$/, "");
    this.fetcher = opts.fetcher ?? fetch.bind(globalThis);
    this.hdrs = opts.headers ?? (() => ({}));
  }
  private url(p: string) { return `${this.base}${p}`; }
  private async json<T>(p: string, init?: RequestInit): Promise<T> {
    const res = await this.fetcher(this.url(p), {
      ...init,
      headers: { "content-type": "application/json", ...this.hdrs(), ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${p} → ${res.status}`);
    return (await res.json()) as T;
  }
  listModels() { return this.json<ModelsResponse>("/models"); }
  getConfig() { return this.json<HarnessConfig>("/config"); }
  putConfig(cfg: HarnessConfig) { return this.json<HarnessConfig>("/config", { method: "PUT", body: JSON.stringify(cfg) }); }
  keyStatus(p: ProviderId) { return this.json<{ hasKey: boolean }>(`/keys/${p}`); }
  putKey(p: ProviderId, key: string) { return this.json<{ hasKey: true }>(`/keys/${p}`, { method: "PUT", body: JSON.stringify({ key }) }); }
  deleteKey(p: ProviderId) { return this.json<{ hasKey: false }>(`/keys/${p}`, { method: "DELETE" }); }
  validateKey(p: ProviderId) { return this.json<{ ok: boolean; message?: string }>(`/keys/${p}/validate`, { method: "POST" }); }
  async *chat(providerId: ProviderId, req: ChatRequest): AsyncIterable<ChatChunk> {
    const res = await this.fetcher(this.url(`/chat?provider=${encodeURIComponent(providerId)}`), {
      method: "POST",
      headers: { "content-type": "application/json", ...this.hdrs() },
      body: JSON.stringify(req),
    });
    if (!res.ok || !res.body) {
      yield { type: "error", error: `chat ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      try { yield JSON.parse(line) as ChatChunk; } catch (e) {
        yield { type: "error" as const, error: `malformed SSE frame: ${String(e)}` };
        return;
      }
    }
  }
}

export interface BrowserTransportOptions {
  ownerId: string;
  storage: StorageAdapter;
  providers: Record<string, Provider>;
  catalog: Catalog;
}

export class BrowserTransport implements Transport {
  constructor(private o: BrowserTransportOptions) {}
  async listModels(): Promise<ModelsResponse> {
    const providers = await Promise.all(
      Object.values(this.o.providers).map(async (p) => ({
        id: p.id,
        displayName: p.displayName,
        models: (await this.o.catalog.listModels(p.id)).map((m) => ({
          id: m.id, displayName: m.displayName,
          capabilities: m.capabilities as unknown as Record<string, boolean>,
        })),
      })),
    );
    return { providers };
  }
  getConfig() { return this.o.storage.getConfig(this.o.ownerId); }
  async putConfig(cfg: HarnessConfig) { await this.o.storage.setConfig(this.o.ownerId, cfg); return cfg; }
  async keyStatus(p: ProviderId) { return { hasKey: await this.o.storage.hasKey(this.o.ownerId, p) }; }
  async putKey(p: ProviderId, key: string) { await this.o.storage.setKey(this.o.ownerId, p, key); return { hasKey: true as const }; }
  async deleteKey(p: ProviderId) { await this.o.storage.deleteKey(this.o.ownerId, p); return { hasKey: false as const }; }
  async validateKey(p: ProviderId) {
    const provider = this.o.providers[p];
    if (!provider) return { ok: false, message: "unknown provider" };
    const key = await this.o.storage.getKey(this.o.ownerId, p);
    if (!key) return { ok: false, message: "no key" };
    return provider.validateKey(key);
  }
  async *chat(p: ProviderId, req: ChatRequest): AsyncIterable<ChatChunk> {
    const provider = this.o.providers[p];
    if (!provider) { yield { type: "error", error: `unknown provider: ${p}` }; return; }
    const key = (await this.o.storage.getKey(this.o.ownerId, p)) ?? "";
    yield* provider.chat(req, key);
  }
}
