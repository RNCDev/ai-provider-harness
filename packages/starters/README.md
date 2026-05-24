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
