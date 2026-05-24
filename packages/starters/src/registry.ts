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
