import { Catalog, type CatalogOptions } from "../catalog/modelsdev.js";
import { ProviderRegistry, defaultProviders } from "../providers/registry.js";
import type { OwnerId, Provider, StorageAdapter } from "../types.js";
import { createHandlers, type Handlers } from "./handlers.js";

export interface CreateHarnessOptions {
  storage: StorageAdapter;
  providers?: Record<string, Provider>;
  catalogOptions?: CatalogOptions;
  identify: (req: unknown) => OwnerId | Promise<OwnerId>;
}

export interface Harness {
  handlers: Handlers;
  identify: CreateHarnessOptions["identify"];
}

export function createHarness(opts: CreateHarnessOptions): Harness {
  const registry = new ProviderRegistry(opts.providers ?? defaultProviders);
  const catalog = new Catalog(opts.catalogOptions);
  const handlers = createHandlers({ storage: opts.storage, registry, catalog });
  return { handlers, identify: opts.identify };
}

export { createHandlers } from "./handlers.js";
export type { Handlers } from "./handlers.js";
export { aphExpress } from "./express.js";
export { aphNext } from "./next.js";
export { aphFastify } from "./fastify.js";
export type { AphFastifyOpts } from "./fastify.js";
export { aphHono } from "./hono.js";
