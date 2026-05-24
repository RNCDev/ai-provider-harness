import { EventEmitter } from "node:events";
import fallback from "./fallback.json" with { type: "json" };
import overrides from "./overrides.json" with { type: "json" };
import type { ModelDescriptor, ProviderId } from "../types.js";

export type CatalogStore = {
  get(k: string): unknown | undefined;
  set(k: string, v: unknown): void;
};

export interface CatalogOptions {
  url?: string;
  ttlMs?: number;
  store?: CatalogStore | Map<string, unknown>;
  now?: () => number;
}

interface CachedSnapshot {
  fetchedAt: number;
  providers: Record<string, { models: Omit<ModelDescriptor, "providerId">[] }>;
}

export class Catalog extends EventEmitter {
  private url: string;
  private ttlMs: number;
  private store: CatalogStore;
  private now: () => number;
  private inFlight: Promise<CachedSnapshot> | null = null;

  constructor(opts: CatalogOptions = {}) {
    super();
    this.url = opts.url ?? "https://models.dev/api.json";
    this.ttlMs = opts.ttlMs ?? 24 * 60 * 60 * 1000;
    this.now = opts.now ?? Date.now;
    const s = opts.store ?? new Map<string, unknown>();
    this.store = "get" in s && typeof s.get === "function" ? (s as CatalogStore) : (s as CatalogStore);
  }

  async listModels(providerId: ProviderId): Promise<ModelDescriptor[]> {
    const snap = await this.snapshot();
    const entry = snap.providers[providerId];
    if (!entry) return [];
    return entry.models.map((m) => ({ ...m, providerId }));
  }

  async refresh(): Promise<void> {
    this.store.set("snapshot", null);
    await this.snapshot();
  }

  overridesFor(providerId: ProviderId): Record<string, unknown> {
    return (overrides as Record<string, Record<string, unknown>>)[providerId] ?? {};
  }

  private async snapshot(): Promise<CachedSnapshot> {
    const cached = this.store.get("snapshot") as CachedSnapshot | null | undefined;
    if (cached && this.now() - cached.fetchedAt < this.ttlMs) return cached;
    if (this.inFlight) return this.inFlight;

    this.inFlight = (async () => {
      try {
        const res = await fetch(this.url);
        if (!res.ok) throw new Error(`models.dev returned ${res.status}`);
        const data = (await res.json()) as CachedSnapshot;
        const snap = { ...data, fetchedAt: this.now() };
        this.store.set("snapshot", snap);
        return snap;
      } catch (err) {
        this.emit("warning", { kind: "catalog-fetch-failed", error: String(err) });
        if (cached) return cached;
        const seed: CachedSnapshot = {
          fetchedAt: this.now(),
          providers: (fallback as unknown as CachedSnapshot).providers,
        };
        this.store.set("snapshot", seed);
        return seed;
      } finally {
        this.inFlight = null;
      }
    })();
    return this.inFlight;
  }
}
