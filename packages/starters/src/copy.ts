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
