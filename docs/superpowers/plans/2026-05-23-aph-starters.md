# `@aph/starters` + Examples Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Plans `2026-05-23-aph-harness-foundation.md` and `2026-05-23-aph-react.md` are complete.

**Goal:** Ship `@aph/starters` v0.1.0 — a shadcn-style CLI that copies a Tailwind-styled `settings-panel` component into a consumer's repo. Plus three runnable examples (`vite-local`, `next-saas`, `express-api`) that exercise the harness end-to-end and double as smoke tests.

**Architecture:** A tiny Node CLI (no React deps) that resolves a template directory inside its own package, copies the source files to a user-supplied destination, and rewrites import paths. Templates are plain `.tsx` files with Tailwind class strings — consumers own and edit them. Examples are real apps in `examples/*` wired into the pnpm workspace so we can run them locally.

**Tech Stack:** Node 20+, Commander (CLI args), execa-free (use node fs), Vitest for CLI tests, Tailwind in the example apps.

---

## File Structure

```
packages/starters/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── src/
│   ├── cli.ts                      # entry: `aph-starters` bin
│   ├── commands/
│   │   ├── add.ts
│   │   └── list.ts
│   ├── registry.ts                 # template id → path resolver
│   └── copy.ts                     # fs copy + transform
├── templates/
│   └── settings-panel/
│       ├── manifest.json
│       ├── SettingsPanel.tsx
│       ├── ChatWindow.tsx
│       └── README.md
└── test/
    ├── add.test.ts
    └── copy.test.ts

examples/
├── vite-local/                     # BrowserTransport, BYO-keys
├── next-saas/                      # ServerTransport, multi-tenant
└── express-api/                    # backend-only consumer
```

---

## Task 1: Package skeleton

**Files:**
- Create: `packages/starters/package.json`
- Create: `packages/starters/tsconfig.json`
- Create: `packages/starters/tsup.config.ts`
- Create: `packages/starters/README.md`
- Create: `packages/starters/src/cli.ts`

- [ ] **Step 1: Write `packages/starters/package.json`**

```json
{
  "name": "@aph/starters",
  "version": "0.1.0",
  "description": "CLI that copies AI Provider Harness starter components into your repo.",
  "license": "MIT",
  "type": "module",
  "bin": { "aph-starters": "./dist/cli.js" },
  "main": "./dist/cli.js",
  "files": ["dist", "templates", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "picocolors": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write `packages/starters/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "lib": ["ES2022"] },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Write `packages/starters/tsup.config.ts`**

```ts
import { defineConfig } from "tsup";
export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: ["esm"],
  banner: { js: "#!/usr/bin/env node" },
  dts: false,
  clean: true,
  target: "es2022",
});
```

- [ ] **Step 4: Write `packages/starters/README.md`**

````markdown
# @aph/starters

shadcn-style CLI that copies styled starter components for AI Provider Harness into your repo.

```bash
npx @aph/starters add settings-panel ./src/components/aph
```

You own the files. Edit them freely.

## Templates

- `settings-panel` — Tailwind-styled settings panel with provider/model select, API key entry, inference params, and a chat box. Built on `@aph/react` hooks/primitives.

## Commands

- `add <template> [dest]` — copy a template to `dest` (default `./components/aph`)
- `list` — print available templates
````

- [ ] **Step 5: Placeholder `src/cli.ts`**

```ts
console.log("aph-starters");
```

- [ ] **Step 6: Install + commit**

```bash
pnpm install
git add packages/starters pnpm-lock.yaml
git commit -m "feat(starters): add package skeleton"
```

---

## Task 2: Template registry + `list` command

**Files:**
- Create: `packages/starters/src/registry.ts`
- Create: `packages/starters/src/commands/list.ts`
- Create: `packages/starters/templates/settings-panel/manifest.json`
- Test: `packages/starters/test/registry.test.ts`

- [ ] **Step 1: Write `templates/settings-panel/manifest.json`**

```json
{
  "id": "settings-panel",
  "displayName": "Settings panel",
  "description": "Provider / model picker, API key entry, inference params, and a chat window. Tailwind-styled.",
  "files": ["SettingsPanel.tsx", "ChatWindow.tsx", "README.md"],
  "peerDependencies": ["@aph/react", "@aph/harness", "react", "tailwindcss"]
}
```

- [ ] **Step 2: Write failing test `test/registry.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { listTemplates, resolveTemplate } from "../src/registry.js";

describe("registry", () => {
  it("includes settings-panel", () => {
    const ids = listTemplates().map((t) => t.id);
    expect(ids).toContain("settings-panel");
  });
  it("resolves settings-panel to a directory with manifest.json", () => {
    const t = resolveTemplate("settings-panel");
    expect(t).not.toBeNull();
    expect(t!.manifest.files).toContain("SettingsPanel.tsx");
  });
  it("returns null for unknown templates", () => {
    expect(resolveTemplate("nope")).toBeNull();
  });
});
```

- [ ] **Step 3: Write `src/registry.ts`**

```ts
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const templatesRoot = resolve(here, "..", "templates");

export interface TemplateManifest {
  id: string;
  displayName: string;
  description: string;
  files: string[];
  peerDependencies?: string[];
}

export interface Template { id: string; dir: string; manifest: TemplateManifest }

export function listTemplates(): Template[] {
  if (!existsSync(templatesRoot)) return [];
  return readdirSync(templatesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = join(templatesRoot, d.name);
      const m = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as TemplateManifest;
      return { id: m.id, dir, manifest: m };
    });
}

export function resolveTemplate(id: string): Template | null {
  return listTemplates().find((t) => t.id === id) ?? null;
}
```

- [ ] **Step 4: Write `src/commands/list.ts`**

```ts
import pc from "picocolors";
import { listTemplates } from "../registry.js";

export function listCommand() {
  const all = listTemplates();
  if (all.length === 0) {
    console.log("No templates found.");
    return;
  }
  for (const t of all) {
    console.log(`${pc.bold(pc.cyan(t.id))}  ${pc.dim(t.manifest.displayName)}`);
    console.log(`  ${t.manifest.description}`);
  }
}
```

- [ ] **Step 5: Run + commit**

```bash
pnpm --filter @aph/starters test registry
git add packages/starters/src packages/starters/templates packages/starters/test/registry.test.ts
git commit -m "feat(starters): add template registry + list command"
```

---

## Task 3: `copy.ts` — copy template files into target

**Files:**
- Create: `packages/starters/src/copy.ts`
- Test: `packages/starters/test/copy.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copyTemplate } from "../src/copy.js";

let src: string, dest: string;

beforeEach(() => {
  src = mkdtempSync(join(tmpdir(), "aph-src-"));
  dest = mkdtempSync(join(tmpdir(), "aph-dst-"));
  writeFileSync(join(src, "manifest.json"), JSON.stringify({ id: "x", displayName: "X", description: "x", files: ["A.tsx", "sub/B.tsx"] }));
  writeFileSync(join(src, "A.tsx"), "import x from '@aph/react';\nexport const A = () => x;\n");
  mkdirSync(join(src, "sub"), { recursive: true });
  writeFileSync(join(src, "sub", "B.tsx"), "export const B = 1;\n");
});

afterEach(() => {
  rmSync(src, { recursive: true, force: true });
  rmSync(dest, { recursive: true, force: true });
});

describe("copyTemplate", () => {
  it("copies all listed files preserving subdirs", async () => {
    const written = await copyTemplate({ srcDir: src, destDir: dest });
    expect(written).toEqual(expect.arrayContaining([join(dest, "A.tsx"), join(dest, "sub", "B.tsx")]));
    expect(readFileSync(join(dest, "A.tsx"), "utf8")).toContain("@aph/react");
  });

  it("refuses to overwrite without --force", async () => {
    await copyTemplate({ srcDir: src, destDir: dest });
    await expect(copyTemplate({ srcDir: src, destDir: dest })).rejects.toThrow(/exists/);
  });

  it("overwrites with force:true", async () => {
    await copyTemplate({ srcDir: src, destDir: dest });
    writeFileSync(join(dest, "A.tsx"), "STALE");
    await copyTemplate({ srcDir: src, destDir: dest, force: true });
    expect(readFileSync(join(dest, "A.tsx"), "utf8")).toContain("@aph/react");
  });
});
```

- [ ] **Step 2: Write `src/copy.ts`**

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { TemplateManifest } from "./registry.js";

export interface CopyOptions {
  srcDir: string;
  destDir: string;
  force?: boolean;
}

export async function copyTemplate(opts: CopyOptions): Promise<string[]> {
  const manifest = JSON.parse(readFileSync(join(opts.srcDir, "manifest.json"), "utf8")) as TemplateManifest;
  const written: string[] = [];
  mkdirSync(opts.destDir, { recursive: true });
  for (const rel of manifest.files) {
    const from = join(opts.srcDir, rel);
    const to = join(opts.destDir, rel);
    if (existsSync(to) && !opts.force) {
      throw new Error(`destination exists: ${to} (pass --force to overwrite)`);
    }
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, readFileSync(from));
    written.push(to);
  }
  return written;
}
```

- [ ] **Step 3: Run + commit**

```bash
pnpm --filter @aph/starters test copy
git add packages/starters/src/copy.ts packages/starters/test/copy.test.ts
git commit -m "feat(starters): add copyTemplate"
```

---

## Task 4: `add` command + CLI wiring

**Files:**
- Create: `packages/starters/src/commands/add.ts`
- Modify: `packages/starters/src/cli.ts`
- Test: `packages/starters/test/add.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { addCommand } from "../src/commands/add.js";

let dest: string;
beforeEach(() => { dest = mkdtempSync(join(tmpdir(), "aph-add-")); });
afterEach(() => rmSync(dest, { recursive: true, force: true }));

describe("addCommand", () => {
  it("copies settings-panel template", async () => {
    await addCommand("settings-panel", dest, {});
    const content = readFileSync(join(dest, "SettingsPanel.tsx"), "utf8");
    expect(content).toContain("@aph/react");
  });
  it("errors on unknown template", async () => {
    await expect(addCommand("nope", dest, {})).rejects.toThrow(/unknown template/i);
  });
});
```

- [ ] **Step 2: Write `src/commands/add.ts`**

```ts
import pc from "picocolors";
import { resolveTemplate } from "../registry.js";
import { copyTemplate } from "../copy.js";

export interface AddOptions { force?: boolean }

export async function addCommand(templateId: string, destDir: string, opts: AddOptions): Promise<void> {
  const t = resolveTemplate(templateId);
  if (!t) throw new Error(`unknown template: ${templateId}`);
  const written = await copyTemplate({ srcDir: t.dir, destDir, force: opts.force });
  console.log(pc.green(`✓ Wrote ${written.length} files to ${destDir}`));
  if (t.manifest.peerDependencies?.length) {
    console.log(pc.dim(`Make sure these are installed: ${t.manifest.peerDependencies.join(", ")}`));
  }
}
```

- [ ] **Step 3: Write `src/cli.ts`**

```ts
import { Command } from "commander";
import { addCommand } from "./commands/add.js";
import { listCommand } from "./commands/list.js";

const program = new Command();
program.name("aph-starters").description("AI Provider Harness starter components").version("0.1.0");

program
  .command("add <template> [dest]")
  .description("copy a template into your project")
  .option("-f, --force", "overwrite existing files")
  .action(async (template: string, dest: string | undefined, opts: { force?: boolean }) => {
    await addCommand(template, dest ?? "./components/aph", opts);
  });

program.command("list").description("list available templates").action(listCommand);

program.parseAsync().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
```

- [ ] **Step 4: Run + commit**

```bash
pnpm --filter @aph/starters test add
git add packages/starters/src packages/starters/test/add.test.ts
git commit -m "feat(starters): add `add` command + CLI wiring"
```

---

## Task 5: `settings-panel` template — `SettingsPanel.tsx`

**Files:**
- Create: `packages/starters/templates/settings-panel/SettingsPanel.tsx`

- [ ] **Step 1: Write the template**

```tsx
"use client";
import {
  HarnessProvider,
  ProviderSelect,
  ModelSelect,
  SettingsForm,
  KeyForm,
  type Transport,
} from "@aph/react";
import { ChatWindow } from "./ChatWindow";

export interface SettingsPanelProps {
  transport: Transport;
}

export function SettingsPanel({ transport }: SettingsPanelProps) {
  return (
    <HarnessProvider transport={transport}>
      <div className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-[300px_1fr]">
        <aside className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Provider</h3>
            <ProviderSelect
              aria-label="Provider"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Model</h3>
            <ModelSelect
              aria-label="Model"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Settings</h3>
            <SettingsForm.Root>
              <Field name="temperature" label="Temperature" />
              <Field name="maxTokens" label="Max tokens" />
              <Field name="topP" label="Top P" />
              <Field name="systemPrompt" label="System prompt" />
            </SettingsForm.Root>
          </section>

          <KeyPanel />
        </aside>

        <main className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <ChatWindow />
        </main>
      </div>
    </HarnessProvider>
  );
}

function Field({ name, label }: { name: "temperature" | "maxTokens" | "topP" | "systemPrompt"; label: string }) {
  return (
    <SettingsForm.Field name={name}>
      <SettingsForm.Label className="mb-1 block text-xs text-zinc-600 dark:text-zinc-400">{label}</SettingsForm.Label>
      <SettingsForm.Control className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900" />
    </SettingsForm.Field>
  );
}

function KeyPanel() {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">API Key</h3>
      <KeyForm.Root providerId="openai" className="space-y-2">
        <KeyForm.Status />
        <div className="flex gap-2">
          <KeyForm.Input
            aria-label="Key"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex gap-2">
          <KeyForm.ValidateButton>Validate</KeyForm.ValidateButton>
          <KeyForm.DeleteButton>Remove</KeyForm.DeleteButton>
        </div>
      </KeyForm.Root>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/starters/templates/settings-panel/SettingsPanel.tsx
git commit -m "feat(starters): add SettingsPanel template"
```

---

## Task 6: `settings-panel` template — `ChatWindow.tsx`

**Files:**
- Create: `packages/starters/templates/settings-panel/ChatWindow.tsx`
- Create: `packages/starters/templates/settings-panel/README.md`

- [ ] **Step 1: Write `ChatWindow.tsx`**

```tsx
"use client";
import { useState } from "react";
import { useChat } from "@aph/react";

export function ChatWindow() {
  const { ready, status, messages, error, send } = useChat();
  const [input, setInput] = useState("");

  return (
    <div className="flex h-[60vh] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-auto bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
            ].join(" ")}
          >
            {m.content || (status === "streaming" && i === messages.length - 1 ? "…" : "")}
          </div>
        ))}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      <form
        className="mt-3 flex gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800"
        onSubmit={(e) => { e.preventDefault(); if (input.trim()) { send(input); setInput(""); } }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!ready || status === "streaming"}
          placeholder={ready ? "Send a message…" : "Pick a model and add a key first"}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={!ready || status === "streaming" || !input.trim()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {status === "streaming" ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Write template `README.md`**

```markdown
# settings-panel

A Tailwind-styled settings panel built on `@aph/react`.

## Usage

```tsx
import { SettingsPanel } from "./SettingsPanel";
import { ServerTransport } from "@aph/react";

const transport = new ServerTransport({ baseUrl: "/api/aph" });
export default function Page() { return <SettingsPanel transport={transport} />; }
```

Make sure Tailwind is configured. Edit any file freely — they're yours.
```

- [ ] **Step 3: Commit**

```bash
git add packages/starters/templates/settings-panel
git commit -m "feat(starters): add ChatWindow + template README"
```

---

## Task 7: Example — `examples/vite-local` (browser mode, BYO key)

**Files:**
- Create: `examples/vite-local/package.json`
- Create: `examples/vite-local/index.html`
- Create: `examples/vite-local/vite.config.ts`
- Create: `examples/vite-local/tailwind.config.js`
- Create: `examples/vite-local/postcss.config.js`
- Create: `examples/vite-local/src/main.tsx`
- Create: `examples/vite-local/src/App.tsx`
- Create: `examples/vite-local/src/index.css`

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@aph-examples/vite-local",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build" },
  "dependencies": {
    "@aph/harness": "workspace:*",
    "@aph/react": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.3.0"
  }
}
```

- [ ] **Step 2: Boilerplate files**

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()] });
```

`tailwind.config.js`:
```js
export default { content: ["./index.html", "./src/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] };
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`index.html`:
```html
<!doctype html><html><head><meta charset="utf-8"/><title>AI Provider Harness — local demo</title></head><body class="bg-zinc-50 dark:bg-zinc-950"><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>
```

`src/index.css`:
```css
@tailwind base; @tailwind components; @tailwind utilities;
```

`src/main.tsx`:
```tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 3: `src/App.tsx`** — uses `BrowserTransport` + a copy of the starter components.

```tsx
import { BrowserTransport } from "@aph/react";
import { MemoryStorageAdapter, OpenAIProvider, AnthropicProvider, GoogleProvider, openrouterProvider, togetherProvider, fireworksProvider, groqProvider, cerebrasProvider, ollamaProvider, Catalog, BrowserStorageAdapter } from "@aph/harness";
import { SettingsPanel } from "./components/SettingsPanel";

const storage = typeof window !== "undefined" ? new BrowserStorageAdapter() : new MemoryStorageAdapter();
const transport = new BrowserTransport({
  ownerId: "demo",
  storage,
  providers: {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
    google: new GoogleProvider(),
    openrouter: openrouterProvider,
    together: togetherProvider,
    fireworks: fireworksProvider,
    groq: groqProvider,
    cerebras: cerebrasProvider,
    ollama: ollamaProvider,
  },
  catalog: new Catalog(),
});

export function App() {
  return <SettingsPanel transport={transport} />;
}
```

- [ ] **Step 4: Pull in starter components**

```bash
mkdir -p examples/vite-local/src/components
cp packages/starters/templates/settings-panel/SettingsPanel.tsx examples/vite-local/src/components/
cp packages/starters/templates/settings-panel/ChatWindow.tsx examples/vite-local/src/components/
```

- [ ] **Step 5: Install + smoke test**

```bash
pnpm install
pnpm --filter @aph-examples/vite-local dev
```
Open http://localhost:5173, pick OpenAI, paste a key, send "hi". Confirm streaming response.

- [ ] **Step 6: Commit**

```bash
git add examples/vite-local pnpm-lock.yaml
git commit -m "feat(examples): add vite-local browser-mode demo"
```

---

## Task 8: Example — `examples/next-saas` (server mode, multi-tenant)

**Files:**
- Create: `examples/next-saas/package.json`
- Create: `examples/next-saas/next.config.mjs`
- Create: `examples/next-saas/tsconfig.json`
- Create: `examples/next-saas/tailwind.config.ts`
- Create: `examples/next-saas/postcss.config.mjs`
- Create: `examples/next-saas/app/layout.tsx`
- Create: `examples/next-saas/app/page.tsx`
- Create: `examples/next-saas/app/api/aph/[...path]/route.ts`
- Create: `examples/next-saas/app/globals.css`
- Create: `examples/next-saas/lib/storage.ts`

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@aph-examples/next-saas",
  "version": "0.0.0",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": {
    "@aph/harness": "workspace:*",
    "@aph/react": "workspace:*",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Standard Next + Tailwind boilerplate**

`next.config.mjs`:
```js
export default { reactStrictMode: true };
```

`tsconfig.json`:
```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "lib": ["ES2022", "DOM"], "jsx": "preserve", "module": "ESNext", "moduleResolution": "Bundler", "allowJs": true, "noEmit": true, "incremental": true, "plugins": [{ "name": "next" }] }, "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"], "exclude": ["node_modules"] }
```

`tailwind.config.ts`:
```ts
import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}"], theme: { extend: {} }, plugins: [] } satisfies Config;
```

`postcss.config.mjs`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

`app/globals.css`:
```css
@tailwind base; @tailwind components; @tailwind utilities;
```

`app/layout.tsx`:
```tsx
import "./globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="bg-zinc-50 dark:bg-zinc-950">{children}</body></html>;
}
```

- [ ] **Step 3: `lib/storage.ts` — in-memory storage that survives within the process (demo only)**

```ts
import { MemoryStorageAdapter } from "@aph/harness";
declare global { var __aphStorage: MemoryStorageAdapter | undefined; }
export const storage = globalThis.__aphStorage ?? (globalThis.__aphStorage = new MemoryStorageAdapter());
```

(Real deployments would swap this for Postgres + libsodium.)

- [ ] **Step 4: `app/api/aph/[...path]/route.ts`**

```ts
import { createHarness, aphNext } from "@aph/harness/server";
import { defaultProviders } from "@aph/harness";
import { cookies } from "next/headers";
import { storage } from "../../../../lib/storage";

const harness = createHarness({
  storage,
  providers: defaultProviders,
  identify: async (req) => {
    const c = cookies();
    let id = c.get("aph_demo_user")?.value;
    if (!id) {
      id = `u_${Math.random().toString(36).slice(2, 10)}`;
      c.set("aph_demo_user", id, { httpOnly: true, sameSite: "lax", path: "/" });
    }
    return id;
  },
});

const handler = aphNext(harness);
export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;
export const DELETE = handler.DELETE;
```

- [ ] **Step 5: Pull template into the app and wire `app/page.tsx`**

```bash
mkdir -p examples/next-saas/components
cp packages/starters/templates/settings-panel/SettingsPanel.tsx examples/next-saas/components/
cp packages/starters/templates/settings-panel/ChatWindow.tsx examples/next-saas/components/
```

`app/page.tsx`:
```tsx
"use client";
import { ServerTransport } from "@aph/react";
import { SettingsPanel } from "../components/SettingsPanel";

const transport = new ServerTransport({ baseUrl: "/api/aph" });

export default function Home() {
  return <SettingsPanel transport={transport} />;
}
```

- [ ] **Step 6: Install, run, smoke**

```bash
pnpm install
pnpm --filter @aph-examples/next-saas dev
```
Open http://localhost:3000, run through provider/model/key/chat.

- [ ] **Step 7: Commit**

```bash
git add examples/next-saas pnpm-lock.yaml
git commit -m "feat(examples): add next-saas server-mode demo"
```

---

## Task 9: Example — `examples/express-api` (backend-only consumer)

**Files:**
- Create: `examples/express-api/package.json`
- Create: `examples/express-api/tsconfig.json`
- Create: `examples/express-api/src/server.ts`

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@aph-examples/express-api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "dev": "tsx src/server.ts" },
  "dependencies": {
    "@aph/harness": "workspace:*",
    "express": "^4.19.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.12.0",
    "tsx": "^4.16.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: `tsconfig.json`**

```json
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "lib": ["ES2022"], "outDir": "dist", "rootDir": "src", "module": "ESNext", "moduleResolution": "Bundler" }, "include": ["src/**/*"] }
```

- [ ] **Step 3: `src/server.ts`**

```ts
import express from "express";
import { createHarness, aphExpress } from "@aph/harness/server";
import { defaultProviders, MemoryStorageAdapter } from "@aph/harness";

const app = express();
app.use(express.json());

const harness = createHarness({
  storage: new MemoryStorageAdapter(),
  providers: defaultProviders,
  identify: (req) => (req as express.Request).header("x-user") ?? "demo",
});

app.use("/aph", aphExpress(harness));

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`aph express demo listening on http://localhost:${port}`));
```

- [ ] **Step 4: Smoke**

```bash
pnpm --filter @aph-examples/express-api dev
# in another shell:
curl http://localhost:3001/aph/models -H "x-user: demo"
curl -X PUT http://localhost:3001/aph/keys/openai -H "x-user: demo" -H "content-type: application/json" -d '{"key":"sk-..."}'
curl -X POST 'http://localhost:3001/aph/chat?provider=openai' -H "x-user: demo" -H "content-type: application/json" -d '{"modelId":"gpt-4o","messages":[{"role":"user","content":"hi"}]}'
```

- [ ] **Step 5: Commit**

```bash
git add examples/express-api pnpm-lock.yaml
git commit -m "feat(examples): add express-api backend-only demo"
```

---

## Task 10: Top-level README update + release prep

**Files:**
- Modify: `README.md`
- Modify: `packages/starters/package.json` (bump if needed)

- [ ] **Step 1: Add a "Try the examples" section to the top-level README**

Append:
````markdown
## Try the examples

```bash
pnpm install
pnpm --filter @aph-examples/vite-local dev       # browser-mode, BYO key
pnpm --filter @aph-examples/next-saas dev        # server-mode, per-user keys
pnpm --filter @aph-examples/express-api dev      # backend-only
```

## Drop the starter into your app

```bash
npx @aph/starters add settings-panel ./src/components/aph
```
````

- [ ] **Step 2: Changeset for `@aph/starters`**

```bash
pnpm changeset  # @aph/starters minor: initial release
```

- [ ] **Step 3: Build everything**

```bash
pnpm -r build
```

- [ ] **Step 4: Commit**

```bash
git add README.md .changeset
git commit -m "docs: top-level README mentions starters CLI and examples; release prep"
```

---

## Verification

1. `pnpm -r test` — every package (harness, react, starters) green.
2. `pnpm -r build` — every package emits `dist/`.
3. `node packages/starters/dist/cli.js list` prints `settings-panel`.
4. In a fresh tmp directory: `node /path/to/starters/dist/cli.js add settings-panel ./out` produces `SettingsPanel.tsx`, `ChatWindow.tsx`, `README.md`.
5. **Three example smoke tests** (manual):
   - `vite-local`: open browser, pick OpenAI, paste a real key, stream a reply.
   - `next-saas`: same flow against the server-backed transport; verify the cookie-scoped user gets isolated config in a second browser profile.
   - `express-api`: the three curl commands in Task 9 step 4 all succeed.
6. CI workflow runs `pnpm -r test && pnpm -r build` to completion.

---

## v1 is complete after this plan lands.

All three packages publish-ready; three runnable examples; README points at all of them.
