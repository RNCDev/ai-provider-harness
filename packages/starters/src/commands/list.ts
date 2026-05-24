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
