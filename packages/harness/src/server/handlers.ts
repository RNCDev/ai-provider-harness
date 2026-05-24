import type { Catalog } from "../catalog/modelsdev.js";
import type { ProviderRegistry } from "../providers/registry.js";
import { validateSettings } from "../schema/settings.js";
import type { ChatChunk, ChatRequest, HarnessConfig, OwnerId, ProviderId, StorageAdapter } from "../types.js";

export interface HandlersDeps {
  storage: StorageAdapter;
  registry: ProviderRegistry;
  catalog: Catalog;
}

export interface Handlers {
  listModels(): Promise<{ providers: { id: string; displayName: string; models: unknown[] }[] }>;
  getConfig(owner: OwnerId): Promise<HarnessConfig>;
  putConfig(owner: OwnerId, cfg: HarnessConfig): Promise<HarnessConfig>;
  putKey(owner: OwnerId, providerId: ProviderId, key: string): Promise<{ hasKey: true }>;
  deleteKey(owner: OwnerId, providerId: ProviderId): Promise<{ hasKey: false }>;
  keyStatus(owner: OwnerId, providerId: ProviderId): Promise<{ hasKey: boolean }>;
  validateKey(owner: OwnerId, providerId: ProviderId): Promise<{ ok: boolean; message?: string }>;
  chat(owner: OwnerId, req: ChatRequest, providerId: ProviderId): AsyncIterable<ChatChunk>;
}

export function createHandlers({ storage, registry, catalog }: HandlersDeps): Handlers {
  return {
    async listModels() {
      const providers = await Promise.all(
        registry.all().map(async (p) => ({
          id: p.id,
          displayName: p.displayName,
          models: await catalog.listModels(p.id),
        })),
      );
      return { providers };
    },
    async getConfig(owner) {
      return storage.getConfig(owner);
    },
    async putConfig(owner, cfg) {
      if (cfg.settings) {
        for (const [modelId, s] of Object.entries(cfg.settings)) {
          const r = validateSettings(s);
          if (!r.ok) throw new Error(`invalid settings for ${modelId}: ${JSON.stringify(r.errors)}`);
        }
      }
      await storage.setConfig(owner, cfg);
      return cfg;
    },
    async putKey(owner, providerId, key) {
      if (!registry.get(providerId)) throw new Error(`unknown provider: ${providerId}`);
      if (typeof key !== "string" || key.length < 1) throw new Error("invalid key");
      await storage.setKey(owner, providerId, key);
      return { hasKey: true };
    },
    async deleteKey(owner, providerId) {
      await storage.deleteKey(owner, providerId);
      return { hasKey: false };
    },
    async keyStatus(owner, providerId) {
      return { hasKey: await storage.hasKey(owner, providerId) };
    },
    async validateKey(owner, providerId) {
      const p = registry.get(providerId);
      if (!p) throw new Error(`unknown provider: ${providerId}`);
      const key = await storage.getKey(owner, providerId);
      if (!key) return { ok: false, message: "no key stored" };
      return p.validateKey(key);
    },
    async *chat(owner, req, providerId) {
      const p = registry.get(providerId);
      if (!p) {
        yield { type: "error" as const, error: `unknown provider: ${providerId}` };
        return;
      }
      const key = await storage.getKey(owner, providerId);
      if (!key && providerId !== "ollama") {
        yield { type: "error" as const, error: "no key stored for provider" };
        return;
      }
      yield* p.chat(req, key ?? "");
    },
  };
}
