# AI Provider Harness — Foundation + `@aph/harness` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the monorepo, write a solid top-level README, and ship `@aph/harness` v0.1.0 — a TypeScript package that gives any Node app a unified `/aph/*` HTTP surface over nine AI providers, with models.dev-backed catalog and pluggable storage.

**Architecture:** pnpm workspace with three publishable packages (this plan ships only `@aph/harness`). Single package with two entry points: main (`@aph/harness`) is browser/edge-safe; `@aph/harness/server` mounts the unified endpoint into Express/Next/Fastify/Hono. Provider adapters implement a tight `Provider` interface. Storage is fronted by a `StorageAdapter` interface; reference implementations: memory, browser, and a server factory.

**Tech Stack:** TypeScript 5.4+, pnpm 9, Vitest, tsup (bundler), Biome (lint/format), Changesets (versioning), Zod (schema validation), Node 20+ for the server entry.

---

## File Structure

```
ai-provider-harness/
├── README.md                              # top-level, written in Task 2
├── LICENSE                                # MIT
├── package.json                           # workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── biome.json
├── .gitignore
├── .changeset/config.json
├── .github/workflows/ci.yml
├── packages/
│   └── harness/
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts
│       ├── README.md
│       ├── src/
│       │   ├── index.ts                   # main entry — re-exports
│       │   ├── types.ts                   # core interfaces
│       │   ├── schema/settings.ts         # zod schemas per setting
│       │   ├── catalog/
│       │   │   ├── modelsdev.ts           # fetch + cache
│       │   │   ├── overrides.json
│       │   │   └── fallback.json          # snapshot bundled at build
│       │   ├── storage/
│       │   │   ├── adapter.ts             # StorageAdapter interface
│       │   │   ├── memory.ts
│       │   │   └── browser.ts
│       │   ├── providers/
│       │   │   ├── base.ts                # shared sse + fetch helpers
│       │   │   ├── openai.ts
│       │   │   ├── anthropic.ts
│       │   │   ├── google.ts
│       │   │   ├── openrouter.ts
│       │   │   ├── together.ts
│       │   │   ├── fireworks.ts
│       │   │   ├── groq.ts
│       │   │   ├── cerebras.ts
│       │   │   ├── ollama.ts
│       │   │   └── registry.ts            # default registry export
│       │   └── server/
│       │       ├── index.ts               # createHarness + adapters
│       │       ├── handlers.ts            # per-route handler functions
│       │       ├── express.ts
│       │       ├── next.ts
│       │       ├── fastify.ts
│       │       └── hono.ts
│       └── test/
│           ├── fixtures/                  # recorded provider responses
│           ├── schema.test.ts
│           ├── catalog.test.ts
│           ├── storage.memory.test.ts
│           ├── storage.browser.test.ts
│           ├── providers/<one per provider>.test.ts
│           └── server.integration.test.ts
```

---

## Task 1: Monorepo skeleton

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `.gitignore`
- Create: `.changeset/config.json`
- Create: `LICENSE`

- [ ] **Step 1: Initialize git and pnpm**

Run from project root:
```bash
git init
pnpm --version  # confirm pnpm 9+
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "ai-provider-harness",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "biome check .",
    "format": "biome format --write .",
    "changeset": "changeset",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.8.0",
    "@changesets/cli": "^2.27.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 3: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
  - "examples/*"
```

- [ ] **Step 4: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 5: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.8.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 }
}
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules
dist
.turbo
.next
coverage
*.log
.DS_Store
.env
.env.local
```

- [ ] **Step 7: Initialize changesets**

```bash
pnpm dlx @changesets/cli init
```

Then replace `.changeset/config.json` with:
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 8: Add MIT LICENSE**

Standard MIT text with copyright line:
```
Copyright (c) 2026 AI Provider Harness contributors
```

- [ ] **Step 9: Install root deps**

```bash
pnpm install
```

Expected: lockfile created, no errors.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "chore: initialize pnpm monorepo with biome, vitest, changesets"
```

---

## Task 2: Top-level README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# AI Provider Harness

> Drop-in TypeScript library that takes the complexity of AI integration out of app builders' hair: one unified endpoint, always-current model list, pluggable storage, headless UI.

## Why

Every app that integrates AI re-implements the same plumbing:

- Provider abstraction across OpenAI, Anthropic, Google, OpenRouter, Groq, Together, Fireworks, Cerebras, Ollama...
- A model picker that goes stale within weeks
- Per-model settings (temperature, max_tokens, top_p, system prompt, stop sequences)
- API key storage that fits the app's auth model
- A settings UI that has to match the host app's design

Existing tools each solve a slice — Vercel AI SDK (provider abstraction), LiteLLM (Python unified API), OpenRouter (hosted proxy), [models.dev](https://models.dev) (curated model catalog) — but no one packages **headless settings UI + unified endpoint + always-current model list + pluggable key storage** together.

AI Provider Harness does. Drop in the package, mount one endpoint, render a few headless hooks/components, and ship. Every pixel of styling stays yours; every piece of logic is shared.

## Packages

| Package | Status | Purpose |
| --- | --- | --- |
| [`@aph/harness`](packages/harness) | v0.1 (this milestone) | Framework-agnostic engine + Node server adapter. Provider registry, models.dev catalog, settings schema, storage adapters, unified `/aph/*` endpoint surface. |
| [`@aph/react`](packages/react) | planned | Headless React hooks (`useProviders`, `useModels`, `useSettings`, `useChat`) + Radix-style unstyled primitives. Works in browser-only or server-backed mode. |
| [`@aph/starters`](packages/starters) | planned | shadcn-style CLI that copies Tailwind-styled component source into your repo. You own the code; we just seed it. |

## Quick start (server-backed Next.js)

```bash
pnpm add @aph/harness
```

```ts
// app/api/aph/[...path]/route.ts
import { createHarness, aphNext } from "@aph/harness/server";
import { defaultProviders } from "@aph/harness";
import { createPostgresStorage } from "./storage";

const harness = createHarness({
  providers: defaultProviders,
  storage: createPostgresStorage(),
  identify: async (req) => (await getSession(req)).userId,
});

export const { GET, POST, PUT } = aphNext(harness);
```

Your app now has:

- `POST /api/aph/chat` — streaming chat across any configured provider/model
- `GET /api/aph/models` — current model catalog from models.dev (cached, with bundled fallback)
- `GET/PUT /api/aph/config` — per-user provider/model/settings
- `PUT /api/aph/keys/:provider` — write-only key storage
- `POST /api/aph/keys/:provider/validate` — round-trip key check

## Design principles

1. **Headless first.** No bundled visual style. Hooks are the primary API; primitives are unstyled.
2. **Same component tree, two runtimes.** Switch between browser-only (BYO keys in IndexedDB) and server-backed (multi-tenant SaaS) without rewriting your UI.
3. **Keys are write-only across the API.** The server returns `hasKey: boolean`, never the key itself.
4. **Models stay current.** Catalog syncs from [models.dev](https://models.dev) on a 24h interval, with a snapshot bundled for offline / first-load.
5. **Tools/function-calling work via passthrough.** v1 ships no opinionated tool-config UI — your code keeps full control.

## Providers (v1)

OpenAI · Anthropic · Google · OpenRouter · Together · Fireworks · Groq · Cerebras · Ollama

Bedrock and Azure OpenAI are deferred to v2 (they require structured multi-field credentials, not a single API key).

## License

MIT
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add top-level README"
```

---

## Task 3: `@aph/harness` package skeleton

**Files:**
- Create: `packages/harness/package.json`
- Create: `packages/harness/tsconfig.json`
- Create: `packages/harness/tsup.config.ts`
- Create: `packages/harness/README.md`
- Create: `packages/harness/src/index.ts`

- [ ] **Step 1: Write `packages/harness/package.json`**

```json
{
  "name": "@aph/harness",
  "version": "0.1.0",
  "description": "Unified AI provider endpoint + models.dev-backed catalog + pluggable storage.",
  "license": "MIT",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./server": {
      "import": "./dist/server/index.js",
      "types": "./dist/server/index.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "peerDependencies": {
    "express": "^4.18.0",
    "fastify": "^4.27.0",
    "hono": "^4.4.0"
  },
  "peerDependenciesMeta": {
    "express": { "optional": true },
    "fastify": { "optional": true },
    "hono": { "optional": true }
  }
}
```

- [ ] **Step 2: Write `packages/harness/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `packages/harness/tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts", "server/index": "src/server/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  target: "es2022",
});
```

- [ ] **Step 4: Write `packages/harness/README.md`**

```markdown
# @aph/harness

Framework-agnostic engine for AI Provider Harness. Provides:

- Pluggable provider registry (OpenAI, Anthropic, Google, OpenRouter, Together, Fireworks, Groq, Cerebras, Ollama)
- models.dev-backed catalog with on-disk cache and bundled fallback
- Per-model settings schema (Zod) with validation
- `StorageAdapter` interface + reference implementations (memory, browser)
- Node server adapter (`@aph/harness/server`) that mounts a unified `/aph/*` endpoint into Express, Next.js, Fastify, or Hono

See the [top-level README](../../README.md) for the project overview.
```

- [ ] **Step 5: Write placeholder `src/index.ts`**

```ts
export {};
```

(Real exports added as later tasks land.)

- [ ] **Step 6: Install package deps**

```bash
pnpm install
```

- [ ] **Step 7: Commit**

```bash
git add packages/harness pnpm-lock.yaml
git commit -m "feat(harness): add package skeleton"
```

---

## Task 4: Core types

**Files:**
- Create: `packages/harness/src/types.ts`
- Test: `packages/harness/test/types.test-d.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type OwnerId = string;
export type ProviderId = string;
export type ModelId = string;

export interface InferenceSettings {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  stop?: string[];
}

export interface Selection {
  providerId: ProviderId;
  modelId: ModelId;
}

export interface HarnessConfig {
  selection?: Selection;
  settings?: Record<ModelId, InferenceSettings>;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatRequest {
  modelId: ModelId;
  messages: ChatMessage[];
  settings?: InferenceSettings;
  tools?: unknown;
  toolChoice?: unknown;
  stream?: boolean;
}

export interface ChatChunk {
  type: "text" | "tool_call" | "finish" | "error";
  text?: string;
  toolCall?: ToolCall;
  finishReason?: string;
  error?: string;
}

export interface ModelDescriptor {
  id: ModelId;
  providerId: ProviderId;
  displayName: string;
  contextWindow?: number;
  maxOutput?: number;
  capabilities: {
    streaming: boolean;
    tools: boolean;
    vision: boolean;
    reasoning: boolean;
  };
}

export interface Provider {
  id: ProviderId;
  displayName: string;
  listModels(): Promise<ModelDescriptor[]>;
  chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk>;
  validateKey(key: string): Promise<{ ok: boolean; message?: string }>;
}

export interface StorageAdapter {
  getConfig(ownerId: OwnerId): Promise<HarnessConfig>;
  setConfig(ownerId: OwnerId, config: HarnessConfig): Promise<void>;
  getKey(ownerId: OwnerId, providerId: ProviderId): Promise<string | null>;
  setKey(ownerId: OwnerId, providerId: ProviderId, key: string): Promise<void>;
  hasKey(ownerId: OwnerId, providerId: ProviderId): Promise<boolean>;
  deleteKey(ownerId: OwnerId, providerId: ProviderId): Promise<void>;
}
```

- [ ] **Step 2: Re-export from `src/index.ts`**

```ts
export * from "./types.js";
```

- [ ] **Step 3: Write `test/types.test-d.ts`** (type-level only; vitest still runs the file)

```ts
import { expectTypeOf, test } from "vitest";
import type { Provider, StorageAdapter, ChatChunk } from "../src/types.js";

test("Provider.chat returns AsyncIterable<ChatChunk>", () => {
  expectTypeOf<ReturnType<Provider["chat"]>>().toEqualTypeOf<AsyncIterable<ChatChunk>>();
});

test("StorageAdapter.hasKey returns Promise<boolean>", () => {
  expectTypeOf<ReturnType<StorageAdapter["hasKey"]>>().toEqualTypeOf<Promise<boolean>>();
});
```

- [ ] **Step 4: Run vitest to confirm green**

```bash
pnpm --filter @aph/harness test
```

Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/harness/src packages/harness/test
git commit -m "feat(harness): define core interfaces"
```

---

## Task 5: Settings schema (Zod)

**Files:**
- Create: `packages/harness/src/schema/settings.ts`
- Test: `packages/harness/test/schema.test.ts`

- [ ] **Step 1: Write failing test `test/schema.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { inferenceSettingsSchema, validateSettings } from "../src/schema/settings.js";

describe("inferenceSettingsSchema", () => {
  it("accepts valid settings", () => {
    const r = validateSettings({ temperature: 0.5, maxTokens: 256, topP: 0.9 });
    expect(r.ok).toBe(true);
  });
  it("rejects temperature > 2", () => {
    const r = validateSettings({ temperature: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.path).toContain("temperature");
  });
  it("rejects negative maxTokens", () => {
    const r = validateSettings({ maxTokens: -1 });
    expect(r.ok).toBe(false);
  });
  it("accepts empty object (all optional)", () => {
    expect(validateSettings({}).ok).toBe(true);
  });
  it("coerces stop:string to stop:[string]", () => {
    const r = validateSettings({ stop: "###" } as unknown);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.stop).toEqual(["###"]);
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm --filter @aph/harness test schema
```
Expected: cannot find module `../src/schema/settings.js`.

- [ ] **Step 3: Write `src/schema/settings.ts`**

```ts
import { z } from "zod";
import type { InferenceSettings } from "../types.js";

export const inferenceSettingsSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(200_000).optional(),
  topP: z.number().min(0).max(1).optional(),
  systemPrompt: z.string().max(100_000).optional(),
  stop: z
    .union([z.string(), z.array(z.string()).max(8)])
    .transform((v) => (typeof v === "string" ? [v] : v))
    .optional(),
});

export type ValidateResult =
  | { ok: true; value: InferenceSettings }
  | { ok: false; errors: { path: (string | number)[]; message: string }[] };

export function validateSettings(input: unknown): ValidateResult {
  const r = inferenceSettingsSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data as InferenceSettings };
  return {
    ok: false,
    errors: r.error.issues.map((i) => ({ path: i.path, message: i.message })),
  };
}
```

- [ ] **Step 4: Re-export from `src/index.ts`**

```ts
export * from "./types.js";
export * from "./schema/settings.js";
```

- [ ] **Step 5: Run — expect pass**

```bash
pnpm --filter @aph/harness test schema
```
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add packages/harness/src/schema packages/harness/test/schema.test.ts packages/harness/src/index.ts
git commit -m "feat(harness): add Zod settings schema with validateSettings"
```

---

## Task 6: Models catalog — fallback snapshot + loader

**Files:**
- Create: `packages/harness/src/catalog/fallback.json`
- Create: `packages/harness/src/catalog/overrides.json`
- Create: `packages/harness/src/catalog/modelsdev.ts`
- Test: `packages/harness/test/catalog.test.ts`

- [ ] **Step 1: Write `src/catalog/overrides.json`**

```json
{
  "anthropic": { "requires": ["maxTokens"] },
  "google": { "supportsSystemPrompt": true },
  "ollama": { "endpointEnvVar": "OLLAMA_BASE_URL" }
}
```

- [ ] **Step 2: Write `src/catalog/fallback.json`** (minimal seed; real snapshot is fetched at first run and committed periodically)

```json
{
  "fetchedAt": "2026-05-23T00:00:00Z",
  "providers": {
    "openai": { "models": [
      { "id": "gpt-4o", "displayName": "GPT-4o", "contextWindow": 128000, "maxOutput": 16384, "capabilities": { "streaming": true, "tools": true, "vision": true, "reasoning": false } },
      { "id": "gpt-4o-mini", "displayName": "GPT-4o mini", "contextWindow": 128000, "maxOutput": 16384, "capabilities": { "streaming": true, "tools": true, "vision": true, "reasoning": false } }
    ] },
    "anthropic": { "models": [
      { "id": "claude-opus-4-7", "displayName": "Claude Opus 4.7", "contextWindow": 1000000, "maxOutput": 64000, "capabilities": { "streaming": true, "tools": true, "vision": true, "reasoning": true } },
      { "id": "claude-sonnet-4-6", "displayName": "Claude Sonnet 4.6", "contextWindow": 200000, "maxOutput": 64000, "capabilities": { "streaming": true, "tools": true, "vision": true, "reasoning": true } }
    ] },
    "google": { "models": [
      { "id": "gemini-1.5-pro", "displayName": "Gemini 1.5 Pro", "contextWindow": 2000000, "maxOutput": 8192, "capabilities": { "streaming": true, "tools": true, "vision": true, "reasoning": false } }
    ] },
    "openrouter": { "models": [] },
    "together": { "models": [] },
    "fireworks": { "models": [] },
    "groq": { "models": [
      { "id": "llama-3.1-70b-versatile", "displayName": "Llama 3.1 70B", "contextWindow": 131072, "maxOutput": 8192, "capabilities": { "streaming": true, "tools": true, "vision": false, "reasoning": false } }
    ] },
    "cerebras": { "models": [] },
    "ollama": { "models": [] }
  }
}
```

- [ ] **Step 3: Write failing test `test/catalog.test.ts`**

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Catalog } from "../src/catalog/modelsdev.js";

describe("Catalog", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns fallback snapshot when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const c = new Catalog({ store: new Map() });
    const models = await c.listModels("openai");
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]?.providerId).toBe("openai");
  });

  it("uses cached value within ttl", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: { openai: { models: [{ id: "x", displayName: "X", capabilities: { streaming: true, tools: false, vision: false, reasoning: false } }] } } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const store = new Map();
    const c = new Catalog({ store, ttlMs: 60_000 });
    await c.listModels("openai");
    await c.listModels("openai");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after ttl expires", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ providers: { openai: { models: [] } } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    const store = new Map();
    const c = new Catalog({ store, ttlMs: 1, now: () => Date.now() });
    await c.listModels("openai");
    await new Promise((r) => setTimeout(r, 5));
    await c.listModels("openai");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("emits warning event when fetch fails but cache exists", async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error("502"));
    vi.stubGlobal("fetch", fetchSpy);
    const store = new Map();
    const c = new Catalog({ store, ttlMs: 1 });
    const warnings: unknown[] = [];
    c.on("warning", (w) => warnings.push(w));
    await c.listModels("openai");
    await new Promise((r) => setTimeout(r, 5));
    await c.listModels("openai");
    expect(warnings.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run — expect failure**

```bash
pnpm --filter @aph/harness test catalog
```

- [ ] **Step 5: Write `src/catalog/modelsdev.ts`**

```ts
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
          providers: (fallback as CachedSnapshot).providers,
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
```

- [ ] **Step 6: Re-export from `src/index.ts`**

```ts
export * from "./types.js";
export * from "./schema/settings.js";
export * from "./catalog/modelsdev.js";
```

- [ ] **Step 7: Run — expect pass**

```bash
pnpm --filter @aph/harness test catalog
```
Expected: 4 passed.

- [ ] **Step 8: Commit**

```bash
git add packages/harness/src/catalog packages/harness/test/catalog.test.ts packages/harness/src/index.ts
git commit -m "feat(harness): add models.dev catalog with cache + bundled fallback"
```

---

## Task 7: Storage — MemoryStorageAdapter

**Files:**
- Create: `packages/harness/src/storage/adapter.ts`
- Create: `packages/harness/src/storage/memory.ts`
- Test: `packages/harness/test/storage.memory.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";

describe("MemoryStorageAdapter", () => {
  it("round-trips config", async () => {
    const s = new MemoryStorageAdapter();
    await s.setConfig("u1", { selection: { providerId: "openai", modelId: "gpt-4o" } });
    const cfg = await s.getConfig("u1");
    expect(cfg.selection?.providerId).toBe("openai");
  });

  it("returns empty config for unknown owner", async () => {
    const s = new MemoryStorageAdapter();
    expect(await s.getConfig("nobody")).toEqual({});
  });

  it("stores and reports key presence without leaking value via hasKey", async () => {
    const s = new MemoryStorageAdapter();
    await s.setKey("u1", "openai", "sk-test");
    expect(await s.hasKey("u1", "openai")).toBe(true);
    expect(await s.getKey("u1", "openai")).toBe("sk-test");
  });

  it("deleteKey removes a key", async () => {
    const s = new MemoryStorageAdapter();
    await s.setKey("u1", "openai", "sk-test");
    await s.deleteKey("u1", "openai");
    expect(await s.hasKey("u1", "openai")).toBe(false);
  });

  it("isolates owners", async () => {
    const s = new MemoryStorageAdapter();
    await s.setKey("u1", "openai", "a");
    await s.setKey("u2", "openai", "b");
    expect(await s.getKey("u1", "openai")).toBe("a");
    expect(await s.getKey("u2", "openai")).toBe("b");
  });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
pnpm --filter @aph/harness test storage.memory
```

- [ ] **Step 3: Write `src/storage/adapter.ts`**

```ts
export type { StorageAdapter } from "../types.js";
```

- [ ] **Step 4: Write `src/storage/memory.ts`**

```ts
import type { HarnessConfig, OwnerId, ProviderId, StorageAdapter } from "../types.js";

export class MemoryStorageAdapter implements StorageAdapter {
  private configs = new Map<OwnerId, HarnessConfig>();
  private keys = new Map<string, string>();
  private k(o: OwnerId, p: ProviderId) {
    return `${o}::${p}`;
  }
  async getConfig(o: OwnerId) {
    return this.configs.get(o) ?? {};
  }
  async setConfig(o: OwnerId, c: HarnessConfig) {
    this.configs.set(o, c);
  }
  async getKey(o: OwnerId, p: ProviderId) {
    return this.keys.get(this.k(o, p)) ?? null;
  }
  async setKey(o: OwnerId, p: ProviderId, v: string) {
    this.keys.set(this.k(o, p), v);
  }
  async hasKey(o: OwnerId, p: ProviderId) {
    return this.keys.has(this.k(o, p));
  }
  async deleteKey(o: OwnerId, p: ProviderId) {
    this.keys.delete(this.k(o, p));
  }
}
```

- [ ] **Step 5: Re-export**

Add to `src/index.ts`:
```ts
export * from "./storage/adapter.js";
export * from "./storage/memory.js";
```

- [ ] **Step 6: Run — expect pass**

```bash
pnpm --filter @aph/harness test storage.memory
```
Expected: 5 passed.

- [ ] **Step 7: Commit**

```bash
git add packages/harness/src/storage packages/harness/test/storage.memory.test.ts packages/harness/src/index.ts
git commit -m "feat(harness): add MemoryStorageAdapter"
```

---

## Task 8: Storage — BrowserStorageAdapter

**Files:**
- Create: `packages/harness/src/storage/browser.ts`
- Test: `packages/harness/test/storage.browser.test.ts`

- [ ] **Step 1: Add jsdom for browser-y tests**

Edit `packages/harness/package.json` devDependencies:
```json
"jsdom": "^24.0.0",
"fake-indexeddb": "^6.0.0"
```

Run:
```bash
pnpm install
```

- [ ] **Step 2: Configure vitest env**

Create `packages/harness/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ["test/storage.browser.test.ts", "jsdom"],
    ],
    setupFiles: ["test/setup.browser.ts"],
  },
});
```

Create `packages/harness/test/setup.browser.ts`:
```ts
import "fake-indexeddb/auto";
```

- [ ] **Step 3: Write failing test `test/storage.browser.test.ts`**

```ts
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { BrowserStorageAdapter } from "../src/storage/browser.js";

afterEach(() => {
  window.localStorage.clear();
});

describe("BrowserStorageAdapter", () => {
  it("persists config to localStorage", async () => {
    const s = new BrowserStorageAdapter();
    await s.setConfig("u1", { selection: { providerId: "openai", modelId: "gpt-4o" } });
    const fresh = new BrowserStorageAdapter();
    expect((await fresh.getConfig("u1")).selection?.modelId).toBe("gpt-4o");
  });

  it("persists keys via IndexedDB", async () => {
    const s = new BrowserStorageAdapter();
    await s.setKey("u1", "openai", "sk-browser");
    const fresh = new BrowserStorageAdapter();
    expect(await fresh.getKey("u1", "openai")).toBe("sk-browser");
  });

  it("hasKey is true after setKey", async () => {
    const s = new BrowserStorageAdapter();
    await s.setKey("u1", "anthropic", "sk-a");
    expect(await s.hasKey("u1", "anthropic")).toBe(true);
  });
});
```

- [ ] **Step 4: Run — expect failure**

```bash
pnpm --filter @aph/harness test storage.browser
```

- [ ] **Step 5: Write `src/storage/browser.ts`**

```ts
import type { HarnessConfig, OwnerId, ProviderId, StorageAdapter } from "../types.js";

const CFG_PREFIX = "aph:cfg:";
const DB_NAME = "aph";
const STORE = "keys";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

export class BrowserStorageAdapter implements StorageAdapter {
  private k(o: OwnerId, p: ProviderId) {
    return `${o}::${p}`;
  }
  async getConfig(o: OwnerId): Promise<HarnessConfig> {
    const raw = localStorage.getItem(CFG_PREFIX + o);
    return raw ? (JSON.parse(raw) as HarnessConfig) : {};
  }
  async setConfig(o: OwnerId, c: HarnessConfig) {
    localStorage.setItem(CFG_PREFIX + o, JSON.stringify(c));
  }
  async getKey(o: OwnerId, p: ProviderId) {
    const v = await tx<string | undefined>("readonly", (s) => s.get(this.k(o, p)) as IDBRequest<string | undefined>);
    return v ?? null;
  }
  async setKey(o: OwnerId, p: ProviderId, v: string) {
    await tx("readwrite", (s) => s.put(v, this.k(o, p)));
  }
  async hasKey(o: OwnerId, p: ProviderId) {
    return (await this.getKey(o, p)) !== null;
  }
  async deleteKey(o: OwnerId, p: ProviderId) {
    await tx("readwrite", (s) => s.delete(this.k(o, p)));
  }
}
```

- [ ] **Step 6: Re-export from `src/index.ts`**

```ts
export * from "./storage/browser.js";
```

- [ ] **Step 7: Run — expect pass**

```bash
pnpm --filter @aph/harness test storage.browser
```
Expected: 3 passed.

- [ ] **Step 8: Commit**

```bash
git add packages/harness/{package.json,vitest.config.ts,src/storage,test} pnpm-lock.yaml
git commit -m "feat(harness): add BrowserStorageAdapter (localStorage + IndexedDB)"
```

---

## Task 9: Provider base helpers — SSE + JSON

**Files:**
- Create: `packages/harness/src/providers/base.ts`
- Test: `packages/harness/test/providers/base.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import { parseSseLines } from "../../src/providers/base.js";

describe("parseSseLines", () => {
  it("yields data lines, skips blanks and comments", async () => {
    const enc = new TextEncoder();
    const chunks = [
      "data: {\"a\":1}\n\n",
      ": ping\n",
      "data: {\"a\":2}\n",
      "\n",
      "data: [DONE]\n\n",
    ];
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (const s of chunks) c.enqueue(enc.encode(s));
        c.close();
      },
    });
    const seen: string[] = [];
    for await (const line of parseSseLines(stream)) seen.push(line);
    expect(seen).toEqual(['{"a":1}', '{"a":2}', "[DONE]"]);
  });

  it("handles data split across chunks", async () => {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode("data: {\"a\""));
        c.enqueue(enc.encode(":1}\n\n"));
        c.close();
      },
    });
    const seen: string[] = [];
    for await (const line of parseSseLines(stream)) seen.push(line);
    expect(seen).toEqual(['{"a":1}']);
  });
});
```

- [ ] **Step 2: Write `src/providers/base.ts`**

```ts
export async function* parseSseLines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
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
    reader.releaseLock();
  }
}

export class ProviderHttpError extends Error {
  constructor(public status: number, public body: string) {
    super(`provider http ${status}: ${body.slice(0, 200)}`);
  }
}

export async function jsonOrThrow(res: Response): Promise<unknown> {
  if (!res.ok) throw new ProviderHttpError(res.status, await res.text());
  return res.json();
}
```

- [ ] **Step 3: Run — expect pass**

```bash
pnpm --filter @aph/harness test providers/base
```
Expected: 2 passed.

- [ ] **Step 4: Commit**

```bash
git add packages/harness/src/providers/base.ts packages/harness/test/providers/base.test.ts
git commit -m "feat(harness): add SSE parser + HTTP helpers for providers"
```

---

## Task 10: OpenAI provider

**Files:**
- Create: `packages/harness/src/providers/openai.ts`
- Test: `packages/harness/test/providers/openai.test.ts`
- Create: `packages/harness/test/fixtures/openai-stream.txt`

- [ ] **Step 1: Create SSE fixture `test/fixtures/openai-stream.txt`**

```
data: {"id":"x","choices":[{"delta":{"content":"Hello"}}]}

data: {"id":"x","choices":[{"delta":{"content":" world"}}]}

data: {"id":"x","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]

```

- [ ] **Step 2: Write failing test `test/providers/openai.test.ts`**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAIProvider } from "../../src/providers/openai.js";

const fixture = readFileSync(join(__dirname, "../fixtures/openai-stream.txt"), "utf8");

afterEach(() => vi.restoreAllMocks());

function streamFromString(s: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(enc.encode(s));
      c.close();
    },
  });
  return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream" } });
}

describe("OpenAIProvider", () => {
  it("streams text chunks then finish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamFromString(fixture)));
    const p = new OpenAIProvider();
    const chunks = [];
    for await (const c of p.chat({ modelId: "gpt-4o", messages: [{ role: "user", content: "hi" }] }, "sk")) {
      chunks.push(c);
    }
    expect(chunks.filter((c) => c.type === "text").map((c) => c.text).join("")).toBe("Hello world");
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("validateKey returns ok:true on 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    const p = new OpenAIProvider();
    expect((await p.validateKey("sk")).ok).toBe(true);
  });

  it("validateKey returns ok:false on 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 })));
    const p = new OpenAIProvider();
    const r = await p.validateKey("bad");
    expect(r.ok).toBe(false);
  });

  it("sends Authorization header and request body", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamFromString(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const p = new OpenAIProvider();
    const iter = p.chat({ modelId: "gpt-4o", messages: [{ role: "user", content: "hi" }], settings: { temperature: 0.7 } }, "sk-abc");
    for await (const _ of iter) { /* drain */ }
    const [, init] = fetchSpy.mock.calls[0]!;
    expect((init as RequestInit).headers).toMatchObject({ Authorization: "Bearer sk-abc" });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe("gpt-4o");
    expect(body.temperature).toBe(0.7);
    expect(body.stream).toBe(true);
  });
});
```

- [ ] **Step 3: Run — expect failure**

```bash
pnpm --filter @aph/harness test providers/openai
```

- [ ] **Step 4: Write `src/providers/openai.ts`**

```ts
import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

const BASE = "https://api.openai.com/v1";

export interface OpenAIProviderOptions {
  baseUrl?: string;
  listModels?: () => Promise<ModelDescriptor[]>;
}

export class OpenAIProvider implements Provider {
  readonly id = "openai";
  readonly displayName = "OpenAI";
  constructor(private opts: OpenAIProviderOptions = {}) {}

  async listModels(): Promise<ModelDescriptor[]> {
    if (this.opts.listModels) return this.opts.listModels();
    return [];
  }

  async validateKey(key: string) {
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/models`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    return res.ok ? { ok: true as const } : { ok: false as const, message: `status ${res.status}` };
  }

  async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
    const body = {
      model: req.modelId,
      messages: req.messages.map(({ role, content, name, toolCallId }) => ({
        role,
        content,
        ...(name && { name }),
        ...(toolCallId && { tool_call_id: toolCallId }),
      })),
      stream: true,
      ...(req.settings?.temperature !== undefined && { temperature: req.settings.temperature }),
      ...(req.settings?.maxTokens !== undefined && { max_tokens: req.settings.maxTokens }),
      ...(req.settings?.topP !== undefined && { top_p: req.settings.topP }),
      ...(req.settings?.stop && { stop: req.settings.stop }),
      ...(req.tools && { tools: req.tools }),
      ...(req.toolChoice && { tool_choice: req.toolChoice }),
    };
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      yield { type: "error", error: `openai http ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      if (line === "[DONE]") return;
      try {
        const evt = JSON.parse(line) as {
          choices?: { delta?: { content?: string }; finish_reason?: string }[];
        };
        const choice = evt.choices?.[0];
        if (choice?.delta?.content) yield { type: "text", text: choice.delta.content };
        if (choice?.finish_reason) yield { type: "finish", finishReason: choice.finish_reason };
      } catch {
        // ignore non-JSON heartbeats
      }
    }
  }
}
```

- [ ] **Step 5: Run — expect pass**

```bash
pnpm --filter @aph/harness test providers/openai
```
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add packages/harness/src/providers/openai.ts packages/harness/test/providers/openai.test.ts packages/harness/test/fixtures/openai-stream.txt
git commit -m "feat(harness): add OpenAI provider"
```

---

## Task 11: Anthropic provider

**Files:**
- Create: `packages/harness/src/providers/anthropic.ts`
- Test: `packages/harness/test/providers/anthropic.test.ts`
- Create: `packages/harness/test/fixtures/anthropic-stream.txt`

- [ ] **Step 1: Fixture `test/fixtures/anthropic-stream.txt`**

```
event: message_start
data: {"type":"message_start","message":{"id":"m1"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hi"}}

event: content_block_delta
data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" there"}}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}

event: message_stop
data: {"type":"message_stop"}

```

- [ ] **Step 2: Write failing test**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicProvider } from "../../src/providers/anthropic.js";

const fixture = readFileSync(join(__dirname, "../fixtures/anthropic-stream.txt"), "utf8");

afterEach(() => vi.restoreAllMocks());

function streamFromString(s: string) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }),
    { status: 200 },
  );
}

describe("AnthropicProvider", () => {
  it("streams text deltas then finish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamFromString(fixture)));
    const p = new AnthropicProvider();
    const chunks = [];
    for await (const c of p.chat(
      { modelId: "claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }], settings: { maxTokens: 100 } },
      "sk-ant",
    )) {
      chunks.push(c);
    }
    expect(chunks.filter((c) => c.type === "text").map((c) => c.text).join("")).toBe("Hi there");
    expect(chunks.at(-1)?.type).toBe("finish");
  });

  it("uses x-api-key + anthropic-version headers", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamFromString(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const p = new AnthropicProvider();
    for await (const _ of p.chat(
      { modelId: "claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }], settings: { maxTokens: 100 } },
      "sk-ant",
    )) { /* drain */ }
    const [, init] = fetchSpy.mock.calls[0]!;
    const h = (init as RequestInit).headers as Record<string, string>;
    expect(h["x-api-key"]).toBe("sk-ant");
    expect(h["anthropic-version"]).toBeDefined();
  });

  it("errors clearly if maxTokens missing", async () => {
    const p = new AnthropicProvider();
    const out = [];
    for await (const c of p.chat({ modelId: "claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }] }, "sk-ant")) {
      out.push(c);
    }
    expect(out[0]?.type).toBe("error");
    expect(out[0]?.error).toMatch(/maxTokens/i);
  });
});
```

- [ ] **Step 3: Write `src/providers/anthropic.ts`**

```ts
import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

const BASE = "https://api.anthropic.com/v1";

export class AnthropicProvider implements Provider {
  readonly id = "anthropic";
  readonly displayName = "Anthropic";
  constructor(private opts: { baseUrl?: string } = {}) {}

  async listModels(): Promise<ModelDescriptor[]> {
    return [];
  }

  async validateKey(key: string) {
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    return res.ok ? { ok: true as const } : { ok: false as const, message: `status ${res.status}` };
  }

  async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
    if (req.settings?.maxTokens === undefined) {
      yield { type: "error", error: "Anthropic requires settings.maxTokens" };
      return;
    }
    const system = req.messages.find((m) => m.role === "system")?.content;
    const messages = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const body = {
      model: req.modelId,
      max_tokens: req.settings.maxTokens,
      stream: true,
      ...(system && { system }),
      ...(req.settings.temperature !== undefined && { temperature: req.settings.temperature }),
      ...(req.settings.topP !== undefined && { top_p: req.settings.topP }),
      ...(req.settings.stop && { stop_sequences: req.settings.stop }),
      ...(req.tools && { tools: req.tools }),
      messages,
    };
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      yield { type: "error", error: `anthropic http ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      try {
        const evt = JSON.parse(line) as {
          type?: string;
          delta?: { type?: string; text?: string; stop_reason?: string };
        };
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta" && evt.delta.text) {
          yield { type: "text", text: evt.delta.text };
        } else if (evt.type === "message_delta" && evt.delta?.stop_reason) {
          yield { type: "finish", finishReason: evt.delta.stop_reason };
        }
      } catch {
        // ignore
      }
    }
  }
}
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter @aph/harness test providers/anthropic
```
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/harness/src/providers/anthropic.ts packages/harness/test/providers/anthropic.test.ts packages/harness/test/fixtures/anthropic-stream.txt
git commit -m "feat(harness): add Anthropic provider"
```

---

## Task 12: Google (Gemini) provider

**Files:**
- Create: `packages/harness/src/providers/google.ts`
- Test: `packages/harness/test/providers/google.test.ts`

- [ ] **Step 1: Write failing test**

Gemini uses `?alt=sse` and a different event shape (`candidates[].content.parts[].text`).

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleProvider } from "../../src/providers/google.js";

afterEach(() => vi.restoreAllMocks());

const fixture = [
  'data: {"candidates":[{"content":{"parts":[{"text":"Hel"}]}}]}\n\n',
  'data: {"candidates":[{"content":{"parts":[{"text":"lo"}]}}]}\n\n',
  'data: {"candidates":[{"finishReason":"STOP"}]}\n\n',
].join("");

function streamFromString(s: string) {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }),
    { status: 200 },
  );
}

describe("GoogleProvider", () => {
  it("streams parts then finish", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamFromString(fixture)));
    const p = new GoogleProvider();
    const out = [];
    for await (const c of p.chat({ modelId: "gemini-1.5-pro", messages: [{ role: "user", content: "hi" }] }, "AIza")) {
      out.push(c);
    }
    expect(out.filter((c) => c.type === "text").map((c) => c.text).join("")).toBe("Hello");
    expect(out.at(-1)?.type).toBe("finish");
  });

  it("passes key via x-goog-api-key header", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamFromString(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const p = new GoogleProvider();
    for await (const _ of p.chat({ modelId: "gemini-1.5-pro", messages: [{ role: "user", content: "hi" }] }, "AIza-x")) { /* drain */ }
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/models/gemini-1.5-pro:streamGenerateContent");
    expect((init as RequestInit).headers).toMatchObject({ "x-goog-api-key": "AIza-x" });
  });
});
```

- [ ] **Step 2: Write `src/providers/google.ts`**

```ts
import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GoogleProvider implements Provider {
  readonly id = "google";
  readonly displayName = "Google";
  constructor(private opts: { baseUrl?: string } = {}) {}

  async listModels(): Promise<ModelDescriptor[]> {
    return [];
  }

  async validateKey(key: string) {
    const res = await fetch(`${this.opts.baseUrl ?? BASE}/models`, {
      headers: { "x-goog-api-key": key },
    });
    return res.ok ? { ok: true as const } : { ok: false as const, message: `status ${res.status}` };
  }

  async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
    const systemInstr = req.messages.find((m) => m.role === "system")?.content;
    const contents = req.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
    const body = {
      contents,
      ...(systemInstr && { systemInstruction: { parts: [{ text: systemInstr }] } }),
      generationConfig: {
        ...(req.settings?.temperature !== undefined && { temperature: req.settings.temperature }),
        ...(req.settings?.maxTokens !== undefined && { maxOutputTokens: req.settings.maxTokens }),
        ...(req.settings?.topP !== undefined && { topP: req.settings.topP }),
        ...(req.settings?.stop && { stopSequences: req.settings.stop }),
      },
      ...(req.tools && { tools: req.tools }),
    };
    const url = `${this.opts.baseUrl ?? BASE}/models/${encodeURIComponent(req.modelId)}:streamGenerateContent?alt=sse`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      yield { type: "error", error: `google http ${res.status}: ${await res.text()}` };
      return;
    }
    for await (const line of parseSseLines(res.body)) {
      try {
        const evt = JSON.parse(line) as {
          candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        };
        const cand = evt.candidates?.[0];
        const text = cand?.content?.parts?.map((p) => p.text ?? "").join("");
        if (text) yield { type: "text", text };
        if (cand?.finishReason) yield { type: "finish", finishReason: cand.finishReason };
      } catch {
        // ignore
      }
    }
  }
}
```

- [ ] **Step 3: Run — expect pass**

```bash
pnpm --filter @aph/harness test providers/google
```

- [ ] **Step 4: Commit**

```bash
git add packages/harness/src/providers/google.ts packages/harness/test/providers/google.test.ts
git commit -m "feat(harness): add Google (Gemini) provider"
```

---

## Tasks 13–18: OpenAI-compatible providers (OpenRouter, Together, Fireworks, Groq, Cerebras, Ollama)

These six providers all speak an OpenAI-compatible `/chat/completions` API, so we ship a single `createOpenAICompatibleProvider({ id, displayName, baseUrl, authHeader })` factory and reuse it. Each task: write the test, drop the file, run.

**Files:**
- Create: `packages/harness/src/providers/openai-compatible.ts` (factory; created once in Task 13)
- Then per task: `packages/harness/src/providers/{openrouter,together,fireworks,groq,cerebras,ollama}.ts`
- Tests: one per provider in `packages/harness/test/providers/`

### Task 13: factory + OpenRouter

- [ ] **Step 1: Write `src/providers/openai-compatible.ts`**

```ts
import type { ChatChunk, ChatRequest, ModelDescriptor, Provider } from "../types.js";
import { parseSseLines } from "./base.js";

export interface OpenAICompatibleConfig {
  id: string;
  displayName: string;
  baseUrl: string;
  authHeader?: (key: string) => Record<string, string>;
  extraHeaders?: Record<string, string>;
  validatePath?: string;
}

export function createOpenAICompatibleProvider(cfg: OpenAICompatibleConfig): Provider {
  const auth = cfg.authHeader ?? ((k) => ({ Authorization: `Bearer ${k}` }));
  return {
    id: cfg.id,
    displayName: cfg.displayName,
    async listModels(): Promise<ModelDescriptor[]> { return []; },
    async validateKey(key) {
      const res = await fetch(`${cfg.baseUrl}${cfg.validatePath ?? "/models"}`, {
        headers: { ...auth(key), ...cfg.extraHeaders },
      });
      return res.ok ? { ok: true } : { ok: false, message: `status ${res.status}` };
    },
    async *chat(req: ChatRequest, key: string): AsyncIterable<ChatChunk> {
      const body = {
        model: req.modelId,
        messages: req.messages.map(({ role, content, name, toolCallId }) => ({
          role, content,
          ...(name && { name }),
          ...(toolCallId && { tool_call_id: toolCallId }),
        })),
        stream: true,
        ...(req.settings?.temperature !== undefined && { temperature: req.settings.temperature }),
        ...(req.settings?.maxTokens !== undefined && { max_tokens: req.settings.maxTokens }),
        ...(req.settings?.topP !== undefined && { top_p: req.settings.topP }),
        ...(req.settings?.stop && { stop: req.settings.stop }),
        ...(req.tools && { tools: req.tools }),
        ...(req.toolChoice && { tool_choice: req.toolChoice }),
      };
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { ...auth(key), ...cfg.extraHeaders, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        yield { type: "error", error: `${cfg.id} http ${res.status}: ${await res.text()}` };
        return;
      }
      for await (const line of parseSseLines(res.body)) {
        if (line === "[DONE]") return;
        try {
          const evt = JSON.parse(line) as {
            choices?: { delta?: { content?: string }; finish_reason?: string }[];
          };
          const choice = evt.choices?.[0];
          if (choice?.delta?.content) yield { type: "text", text: choice.delta.content };
          if (choice?.finish_reason) yield { type: "finish", finishReason: choice.finish_reason };
        } catch { /* ignore */ }
      }
    },
  };
}
```

- [ ] **Step 2: Write `src/providers/openrouter.ts`**

```ts
import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const openrouterProvider = createOpenAICompatibleProvider({
  id: "openrouter",
  displayName: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  extraHeaders: { "HTTP-Referer": "https://aph.dev", "X-Title": "AI Provider Harness" },
});

export class OpenRouterProvider {
  static create() { return openrouterProvider; }
}
```

- [ ] **Step 3: Write `test/providers/openrouter.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { openrouterProvider } from "../../src/providers/openrouter.js";

afterEach(() => vi.restoreAllMocks());

const fixture = 'data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: {"choices":[{"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n';
function streamRes(s: string) {
  const enc = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(s)); c.close(); } }), { status: 200 });
}

describe("openrouterProvider", () => {
  it("streams via /chat/completions", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(streamRes(fixture));
    vi.stubGlobal("fetch", fetchSpy);
    const out = [];
    for await (const c of openrouterProvider.chat({ modelId: "anthropic/claude-sonnet-4-6", messages: [{ role: "user", content: "hi" }] }, "or-key")) out.push(c);
    expect(out[0]?.text).toBe("hi");
    expect(String(fetchSpy.mock.calls[0]![0])).toContain("openrouter.ai/api/v1/chat/completions");
  });
});
```

- [ ] **Step 4: Run + commit**

```bash
pnpm --filter @aph/harness test providers/openrouter
git add packages/harness/src/providers/{openai-compatible,openrouter}.ts packages/harness/test/providers/openrouter.test.ts
git commit -m "feat(harness): add OpenAI-compatible factory + OpenRouter provider"
```

### Task 14: Together provider

- [ ] **Step 1: Write `src/providers/together.ts`**

```ts
import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const togetherProvider = createOpenAICompatibleProvider({
  id: "together",
  displayName: "Together AI",
  baseUrl: "https://api.together.xyz/v1",
});
```

- [ ] **Step 2: Test (mirror of openrouter.test.ts with baseUrl assertion `api.together.xyz`)** — copy the openrouter test, change provider import and the URL assertion.

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/harness test providers/together
git add packages/harness/src/providers/together.ts packages/harness/test/providers/together.test.ts
git commit -m "feat(harness): add Together provider"
```

### Task 15: Fireworks provider

- [ ] **Step 1: Write `src/providers/fireworks.ts`**

```ts
import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const fireworksProvider = createOpenAICompatibleProvider({
  id: "fireworks",
  displayName: "Fireworks AI",
  baseUrl: "https://api.fireworks.ai/inference/v1",
});
```

- [ ] **Step 2: Test (mirror, URL substring `fireworks.ai/inference/v1`)**.

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/harness test providers/fireworks
git add packages/harness/src/providers/fireworks.ts packages/harness/test/providers/fireworks.test.ts
git commit -m "feat(harness): add Fireworks provider"
```

### Task 16: Groq provider

- [ ] **Step 1: Write `src/providers/groq.ts`**

```ts
import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const groqProvider = createOpenAICompatibleProvider({
  id: "groq",
  displayName: "Groq",
  baseUrl: "https://api.groq.com/openai/v1",
});
```

- [ ] **Step 2: Test (mirror, URL substring `api.groq.com/openai/v1`)**.

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/harness test providers/groq
git add packages/harness/src/providers/groq.ts packages/harness/test/providers/groq.test.ts
git commit -m "feat(harness): add Groq provider"
```

### Task 17: Cerebras provider

- [ ] **Step 1: Write `src/providers/cerebras.ts`**

```ts
import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export const cerebrasProvider = createOpenAICompatibleProvider({
  id: "cerebras",
  displayName: "Cerebras",
  baseUrl: "https://api.cerebras.ai/v1",
});
```

- [ ] **Step 2: Test (mirror, URL substring `api.cerebras.ai/v1`)**.

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/harness test providers/cerebras
git add packages/harness/src/providers/cerebras.ts packages/harness/test/providers/cerebras.test.ts
git commit -m "feat(harness): add Cerebras provider"
```

### Task 18: Ollama provider

Ollama is OpenAI-compatible at `/v1` but typically local and **keyless**. The factory still works — we accept any string for `key` (including empty).

- [ ] **Step 1: Write `src/providers/ollama.ts`**

```ts
import { createOpenAICompatibleProvider } from "./openai-compatible.js";

export function createOllamaProvider(baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434") {
  return createOpenAICompatibleProvider({
    id: "ollama",
    displayName: "Ollama",
    baseUrl: `${baseUrl.replace(/\/$/, "")}/v1`,
    authHeader: () => ({}),
  });
}

export const ollamaProvider = createOllamaProvider();
```

- [ ] **Step 2: Test** — confirm no Authorization header is sent and baseUrl assertion contains `:11434/v1`. Use empty key string `""`.

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/harness test providers/ollama
git add packages/harness/src/providers/ollama.ts packages/harness/test/providers/ollama.test.ts
git commit -m "feat(harness): add Ollama provider (local, keyless)"
```

---

## Task 19: Provider registry

**Files:**
- Create: `packages/harness/src/providers/registry.ts`
- Test: `packages/harness/test/providers/registry.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import { defaultProviders, ProviderRegistry } from "../../src/providers/registry.js";

describe("defaultProviders", () => {
  it("exposes 9 providers", () => {
    expect(Object.keys(defaultProviders)).toHaveLength(9);
    expect(defaultProviders.openai).toBeDefined();
    expect(defaultProviders.ollama).toBeDefined();
  });
});

describe("ProviderRegistry", () => {
  it("returns provider by id", () => {
    const r = new ProviderRegistry(defaultProviders);
    expect(r.get("openai")?.id).toBe("openai");
    expect(r.get("nope")).toBeUndefined();
  });
  it("lists ids", () => {
    expect(new ProviderRegistry(defaultProviders).ids().length).toBe(9);
  });
});
```

- [ ] **Step 2: Write `src/providers/registry.ts`**

```ts
import type { Provider } from "../types.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GoogleProvider } from "./google.js";
import { openrouterProvider } from "./openrouter.js";
import { togetherProvider } from "./together.js";
import { fireworksProvider } from "./fireworks.js";
import { groqProvider } from "./groq.js";
import { cerebrasProvider } from "./cerebras.js";
import { ollamaProvider } from "./ollama.js";

export const defaultProviders: Record<string, Provider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  google: new GoogleProvider(),
  openrouter: openrouterProvider,
  together: togetherProvider,
  fireworks: fireworksProvider,
  groq: groqProvider,
  cerebras: cerebrasProvider,
  ollama: ollamaProvider,
};

export class ProviderRegistry {
  constructor(private map: Record<string, Provider>) {}
  get(id: string): Provider | undefined { return this.map[id]; }
  ids(): string[] { return Object.keys(this.map); }
  all(): Provider[] { return Object.values(this.map); }
}
```

- [ ] **Step 3: Re-export from `src/index.ts`**

```ts
export * from "./providers/registry.js";
export * from "./providers/openai.js";
export * from "./providers/anthropic.js";
export * from "./providers/google.js";
export * from "./providers/openrouter.js";
export * from "./providers/together.js";
export * from "./providers/fireworks.js";
export * from "./providers/groq.js";
export * from "./providers/cerebras.js";
export * from "./providers/ollama.js";
export * from "./providers/openai-compatible.js";
```

- [ ] **Step 4: Run all tests**

```bash
pnpm --filter @aph/harness test
```
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add packages/harness/src/providers/registry.ts packages/harness/test/providers/registry.test.ts packages/harness/src/index.ts
git commit -m "feat(harness): add provider registry + default 9-provider bundle"
```

---

## Task 20: Server harness — handlers

**Files:**
- Create: `packages/harness/src/server/index.ts`
- Create: `packages/harness/src/server/handlers.ts`
- Test: `packages/harness/test/server.handlers.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { Catalog } from "../src/catalog/modelsdev.js";
import { ProviderRegistry } from "../src/providers/registry.js";
import { createHandlers } from "../src/server/handlers.js";
import type { Provider } from "../src/types.js";

function fakeProvider(id = "fake"): Provider {
  return {
    id,
    displayName: id,
    async listModels() { return [{ id: "m1", providerId: id, displayName: "M1", capabilities: { streaming: true, tools: false, vision: false, reasoning: false } }]; },
    async validateKey(k) { return { ok: k === "good" }; },
    async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
  };
}

describe("handlers", () => {
  const setup = () => {
    const storage = new MemoryStorageAdapter();
    const registry = new ProviderRegistry({ fake: fakeProvider() });
    const catalog = new Catalog({ store: new Map() });
    return createHandlers({ storage, registry, catalog });
  };

  it("config: empty for new owner", async () => {
    const h = setup();
    const r = await h.getConfig("u1");
    expect(r).toEqual({});
  });

  it("config: round-trip", async () => {
    const h = setup();
    await h.putConfig("u1", { selection: { providerId: "fake", modelId: "m1" } });
    expect((await h.getConfig("u1")).selection?.modelId).toBe("m1");
  });

  it("keys: set + hasKey", async () => {
    const h = setup();
    await h.putKey("u1", "fake", "good");
    expect(await h.keyStatus("u1", "fake")).toEqual({ hasKey: true });
  });

  it("keys: validate returns ok with stored key", async () => {
    const h = setup();
    await h.putKey("u1", "fake", "good");
    expect((await h.validateKey("u1", "fake")).ok).toBe(true);
  });

  it("keys: validate fails for unknown provider", async () => {
    const h = setup();
    await expect(h.validateKey("u1", "nope")).rejects.toThrow(/unknown provider/);
  });

  it("chat: streams chunks", async () => {
    const h = setup();
    await h.putKey("u1", "fake", "good");
    const out = [];
    for await (const c of h.chat("u1", { modelId: "m1", messages: [{ role: "user", content: "hi" }] }, "fake")) out.push(c);
    expect(out.map((c) => c.type)).toEqual(["text", "finish"]);
  });

  it("chat: errors if no key", async () => {
    const h = setup();
    const out = [];
    for await (const c of h.chat("u1", { modelId: "m1", messages: [{ role: "user", content: "hi" }] }, "fake")) out.push(c);
    expect(out[0]?.type).toBe("error");
  });
});
```

- [ ] **Step 2: Write `src/server/handlers.ts`**

```ts
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
        yield { type: "error", error: `unknown provider: ${providerId}` };
        return;
      }
      const key = await storage.getKey(owner, providerId);
      if (!key && providerId !== "ollama") {
        yield { type: "error", error: "no key stored for provider" };
        return;
      }
      yield* p.chat(req, key ?? "");
    },
  };
}
```

- [ ] **Step 3: Write `src/server/index.ts`**

```ts
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
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter @aph/harness test server.handlers
```
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/harness/src/server packages/harness/test/server.handlers.test.ts
git commit -m "feat(harness): add server harness + handlers"
```

---

## Task 21: Express adapter

**Files:**
- Create: `packages/harness/src/server/express.ts`
- Test: `packages/harness/test/server.express.test.ts`

- [ ] **Step 1: Add dev dep**

`packages/harness/package.json` devDependencies:
```json
"express": "^4.19.0",
"supertest": "^7.0.0",
"@types/express": "^4.17.0",
"@types/supertest": "^6.0.0"
```

Run `pnpm install`.

- [ ] **Step 2: Write failing test `test/server.express.test.ts`**

```ts
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
```

- [ ] **Step 3: Write `src/server/express.ts`**

```ts
import type { RequestHandler, Router } from "express";
import { Router as makeRouter } from "express";
import type { Harness } from "./index.js";

export function aphExpress(harness: Harness): Router {
  const r = makeRouter();
  const owner = async (req: Parameters<RequestHandler>[0]) => await harness.identify(req);

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
      if (!key) return res.status(400).json({ error: "missing key" });
      res.json(await harness.handlers.putKey(await owner(req), req.params.provider, key));
    } catch (e) { next(e); }
  });
  r.delete("/keys/:provider", async (req, res, next) => {
    try { res.json(await harness.handlers.deleteKey(await owner(req), req.params.provider)); } catch (e) { next(e); }
  });
  r.get("/keys/:provider", async (req, res, next) => {
    try { res.json(await harness.handlers.keyStatus(await owner(req), req.params.provider)); } catch (e) { next(e); }
  });
  r.post("/keys/:provider/validate", async (req, res, next) => {
    try { res.json(await harness.handlers.validateKey(await owner(req), req.params.provider)); } catch (e) { next(e); }
  });
  r.post("/chat", async (req, res, next) => {
    try {
      const providerId = String(req.query.provider ?? "");
      if (!providerId) return res.status(400).json({ error: "missing ?provider" });
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
```

- [ ] **Step 4: Run — expect pass**

```bash
pnpm --filter @aph/harness test server.express
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add packages/harness/{package.json,src/server/express.ts,test/server.express.test.ts} pnpm-lock.yaml
git commit -m "feat(harness): add Express adapter"
```

---

## Task 22: Next.js route handler adapter

**Files:**
- Create: `packages/harness/src/server/next.ts`
- Test: `packages/harness/test/server.next.test.ts`

- [ ] **Step 1: Write failing test**

```ts
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
```

- [ ] **Step 2: Write `src/server/next.ts`**

```ts
import type { Harness } from "./index.js";

type Ctx = { params: { path: string[] } };
type RouteHandler = (req: Request, ctx: Ctx) => Promise<Response>;

export function aphNext(harness: Harness): { GET: RouteHandler; POST: RouteHandler; PUT: RouteHandler; DELETE: RouteHandler } {
  async function ownerOf(req: Request) {
    return harness.identify(req);
  }
  async function route(req: Request, ctx: Ctx): Promise<Response> {
    const [head, sub] = ctx.params.path;
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
        if (req.method === "POST" && ctx.params.path[2] === "validate") {
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
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/harness test server.next
git add packages/harness/src/server/next.ts packages/harness/test/server.next.test.ts
git commit -m "feat(harness): add Next.js route handler adapter"
```

---

## Task 23: Fastify adapter

**Files:**
- Create: `packages/harness/src/server/fastify.ts`
- Test: `packages/harness/test/server.fastify.test.ts`

- [ ] **Step 1: Add devDep `fastify@^4.27.0`. Run pnpm install.**

- [ ] **Step 2: Write failing test (parallels the Express test shape, using `fastify.inject(...)`).**

```ts
import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphFastify } from "../src/server/fastify.js";

async function makeApp() {
  const app = Fastify();
  const harness = createHarness({
    storage: new MemoryStorageAdapter(),
    providers: { fake: {
      id: "fake", displayName: "Fake",
      async listModels() { return []; },
      async validateKey() { return { ok: true }; },
      async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
    } },
    identify: (req) => ((req as { headers: Record<string, string> }).headers["x-user"] ?? "anon"),
  });
  await app.register(aphFastify, { harness, prefix: "/aph" });
  return app;
}

describe("aphFastify", () => {
  it("GET /aph/models works", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "GET", url: "/aph/models", headers: { "x-user": "u1" } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).providers[0].id).toBe("fake");
  });
  it("PUT /aph/keys/:provider stores key", async () => {
    const app = await makeApp();
    const res = await app.inject({ method: "PUT", url: "/aph/keys/fake", headers: { "x-user": "u1", "content-type": "application/json" }, payload: JSON.stringify({ key: "k" }) });
    expect(JSON.parse(res.body)).toEqual({ hasKey: true });
  });
});
```

- [ ] **Step 3: Write `src/server/fastify.ts`**

```ts
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
    const providerId = String((req.query as Record<string, string>).provider ?? "");
    if (!providerId) return reply.code(400).send({ error: "missing ?provider" });
    reply.raw.setHeader("content-type", "text/event-stream");
    reply.raw.setHeader("cache-control", "no-cache");
    for await (const c of h.handlers.chat(await owner(req), req.body as Parameters<typeof h.handlers.chat>[1], providerId)) {
      reply.raw.write(`data: ${JSON.stringify(c)}\n\n`);
    }
    reply.raw.end();
  });
};
```

- [ ] **Step 4: Run + commit**

```bash
pnpm --filter @aph/harness test server.fastify
git add packages/harness/{package.json,src/server/fastify.ts,test/server.fastify.test.ts} pnpm-lock.yaml
git commit -m "feat(harness): add Fastify adapter"
```

---

## Task 24: Hono adapter

**Files:**
- Create: `packages/harness/src/server/hono.ts`
- Test: `packages/harness/test/server.hono.test.ts`

- [ ] **Step 1: Add devDep `hono@^4.4.0`. Run pnpm install.**

- [ ] **Step 2: Write failing test**

```ts
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphHono } from "../src/server/hono.js";

function makeApp() {
  const harness = createHarness({
    storage: new MemoryStorageAdapter(),
    providers: { fake: {
      id: "fake", displayName: "Fake",
      async listModels() { return []; },
      async validateKey() { return { ok: true }; },
      async *chat() { yield { type: "text", text: "ok" }; yield { type: "finish", finishReason: "stop" }; },
    } },
    identify: (req) => ((req as Request).headers.get("x-user") ?? "anon"),
  });
  const app = new Hono();
  app.route("/aph", aphHono(harness));
  return app;
}

describe("aphHono", () => {
  it("GET /aph/models", async () => {
    const res = await makeApp().request("/aph/models", { headers: { "x-user": "u1" } });
    expect(res.status).toBe(200);
    expect((await res.json()).providers[0].id).toBe("fake");
  });
  it("PUT /aph/keys/:provider", async () => {
    const res = await makeApp().request("/aph/keys/fake", { method: "PUT", headers: { "x-user": "u1", "content-type": "application/json" }, body: JSON.stringify({ key: "k" }) });
    expect(await res.json()).toEqual({ hasKey: true });
  });
});
```

- [ ] **Step 3: Write `src/server/hono.ts`**

```ts
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
    const { key } = (await c.req.json()) as { key?: string };
    if (!key) return c.json({ error: "missing key" }, 400);
    return c.json(await harness.handlers.putKey(await owner(c.req.raw), c.req.param("provider"), key));
  });
  app.delete("/keys/:provider", async (c) => c.json(await harness.handlers.deleteKey(await owner(c.req.raw), c.req.param("provider"))));
  app.post("/keys/:provider/validate", async (c) => c.json(await harness.handlers.validateKey(await owner(c.req.raw), c.req.param("provider"))));
  app.post("/chat", async (c) => {
    const providerId = c.req.query("provider");
    if (!providerId) return c.json({ error: "missing ?provider" }, 400);
    const body = await c.req.json();
    const ownerId = await owner(c.req.raw);
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of harness.handlers.chat(ownerId, body, providerId)) {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
  });
  return app;
}
```

- [ ] **Step 4: Run + commit**

```bash
pnpm --filter @aph/harness test server.hono
git add packages/harness/{package.json,src/server/hono.ts,test/server.hono.test.ts} pnpm-lock.yaml
git commit -m "feat(harness): add Hono adapter"
```

---

## Task 25: End-to-end integration test

**Files:**
- Create: `packages/harness/test/server.integration.test.ts`

- [ ] **Step 1: Write the integration test**

```ts
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { MemoryStorageAdapter } from "../src/storage/memory.js";
import { createHarness } from "../src/server/index.js";
import { aphExpress } from "../src/server/express.js";
import { OpenAIProvider } from "../src/providers/openai.js";

const sseFixture = [
  'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
  'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
  'data: {"choices":[{"finish_reason":"stop"}]}\n\n',
  "data: [DONE]\n\n",
].join("");

function streamRes() {
  const enc = new TextEncoder();
  return new Response(new ReadableStream<Uint8Array>({ start(c) { c.enqueue(enc.encode(sseFixture)); c.close(); } }), { status: 200 });
}

describe("integration: express + openai", () => {
  it("set key → put config → chat streams from provider", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(streamRes()));
    const harness = createHarness({
      storage: new MemoryStorageAdapter(),
      providers: { openai: new OpenAIProvider() },
      identify: (req) => (req as express.Request).header("x-user") ?? "anon",
    });
    const app = express();
    app.use(express.json());
    app.use("/aph", aphExpress(harness));

    await request(app).put("/aph/keys/openai").set("x-user", "u1").send({ key: "sk" }).expect(200);
    await request(app).put("/aph/config").set("x-user", "u1").send({
      selection: { providerId: "openai", modelId: "gpt-4o" },
      settings: { "gpt-4o": { temperature: 0.5, maxTokens: 100 } },
    }).expect(200);

    const res = await request(app)
      .post("/aph/chat?provider=openai")
      .set("x-user", "u1")
      .send({ modelId: "gpt-4o", messages: [{ role: "user", content: "say hi" }] });

    expect(res.status).toBe(200);
    expect(res.text).toContain('"text":"Hello"');
    expect(res.text).toContain('"text":" world"');
    expect(res.text).toContain('"type":"finish"');
  });
});
```

- [ ] **Step 2: Run + commit**

```bash
pnpm --filter @aph/harness test server.integration
git add packages/harness/test/server.integration.test.ts
git commit -m "test(harness): end-to-end express + openai integration"
```

---

## Task 26: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write CI**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm -r build
      - run: pnpm -r test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow"
```

---

## Task 27: Release prep

- [ ] **Step 1: Build all packages**

```bash
pnpm -r build
```
Expected: `packages/harness/dist/` populated with both `index.js` and `server/index.js`.

- [ ] **Step 2: Create a changeset**

```bash
pnpm changeset
```
Select `@aph/harness`, minor bump, write summary `Initial release: unified AI provider endpoint with 9 providers, models.dev catalog, pluggable storage, and Express/Next/Fastify/Hono adapters.`

- [ ] **Step 3: Verify package contents**

```bash
cd packages/harness && pnpm pack --dry-run
```
Inspect file list: should include `dist/index.js`, `dist/index.d.ts`, `dist/server/index.js`, `dist/server/index.d.ts`, `README.md`.

- [ ] **Step 4: Commit**

```bash
git add .changeset
git commit -m "chore: changeset for @aph/harness v0.1.0"
```

---

## Verification

After all tasks land, the following must pass end-to-end:

1. `pnpm -r test` — all unit + integration suites green
2. `pnpm -r build` — `@aph/harness` builds both entry points cleanly
3. **Smoke** in a scratch project:
   ```ts
   import express from "express";
   import { createHarness, aphExpress } from "@aph/harness/server";
   import { defaultProviders, MemoryStorageAdapter } from "@aph/harness";
   const app = express();
   app.use(express.json());
   app.use("/aph", aphExpress(createHarness({
     storage: new MemoryStorageAdapter(),
     providers: defaultProviders,
     identify: () => "demo",
   })));
   app.listen(3000);
   ```
   Then `curl http://localhost:3000/aph/models` returns a populated list.
4. **Live provider smoke** (gated on env vars; optional in CI): for each provider with `APH_LIVE_<PROVIDER>_KEY` set, send one chat request and assert non-empty stream.

---

## Out of scope (handled by other plans)

- React hooks + primitives → `2026-05-23-aph-react.md`
- CLI + Tailwind-styled starter templates + examples → `2026-05-23-aph-starters.md`
