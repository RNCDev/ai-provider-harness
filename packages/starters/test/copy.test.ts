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
