# AI Provider Harness

> Drop-in TypeScript library for AI provider/model integration: one unified endpoint, always-current model list, pluggable storage, headless UI.

## Why

Every app that integrates AI re-implements the same plumbing:

- Provider abstraction across OpenAI, Anthropic, Google, OpenRouter, Groq, Together, Fireworks, Cerebras, Ollama…
- A model picker that goes stale within weeks
- Per-model settings (temperature, max_tokens, top_p, system prompt, stop sequences)
- API key storage that fits the app's auth model
- A settings UI that has to match the host app's design

Existing tools each solve a slice — Vercel AI SDK (provider abstraction), LiteLLM (Python unified API), OpenRouter (hosted proxy), [models.dev](https://models.dev) (curated model catalog) — but no one packages **headless settings UI + unified endpoint + always-current model list + pluggable key storage** together.

AI Provider Harness does. Drop in the package, mount one endpoint, render a few headless hooks/components, and ship. Every pixel of styling stays yours; every piece of logic is shared.

## Status

This repo is in active design. Implementation plans are in [`docs/superpowers/plans/`](docs/superpowers/plans/). Packages will appear under [`packages/`](packages/) as each plan lands.

## Packages

| Package | Status | Purpose |
| --- | --- | --- |
| `@aph/harness` | planned (v0.1) | Framework-agnostic engine + Node server adapter. Provider registry, models.dev catalog, settings schema, storage adapters, unified `/aph/*` endpoint surface. |
| `@aph/react` | planned | Headless React hooks (`useProviders`, `useModels`, `useSettings`, `useChat`) + Radix-style unstyled primitives. Works in browser-only or server-backed mode. |
| `@aph/starters` | planned | shadcn-style CLI that copies Tailwind-styled component source into your repo. You own the code; we just seed it. |

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

## Roadmap

- **v1** — the three packages above, TypeScript only, with three runnable examples (`vite-local`, `next-saas`, `express-api`).
- **v2** — Python package, Bedrock + Azure OpenAI (with structured credentials), tools-config UI, Vue/Svelte bindings via the same `@aph/harness` core.

## License

MIT
