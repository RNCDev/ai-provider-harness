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
