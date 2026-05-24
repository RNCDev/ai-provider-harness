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
