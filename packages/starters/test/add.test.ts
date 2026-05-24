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
