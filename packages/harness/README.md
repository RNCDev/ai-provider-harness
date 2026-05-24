# @aph/harness

Framework-agnostic engine for AI Provider Harness. Provides:

- Pluggable provider registry (OpenAI, Anthropic, Google, OpenRouter, Together, Fireworks, Groq, Cerebras, Ollama)
- models.dev-backed catalog with on-disk cache and bundled fallback
- Per-model settings schema (Zod) with validation
- `StorageAdapter` interface + reference implementations (memory, browser)
- Node server adapter (`@aph/harness/server`) that mounts a unified `/aph/*` endpoint into Express, Next.js, Fastify, or Hono

See the [top-level README](../../README.md) for the project overview.
