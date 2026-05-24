import { describe, expect, it } from "vitest";
import { inferenceSettingsSchema, validateSettings } from "../src/schema/settings.js";

describe("inferenceSettingsSchema", () => {
  it("accepts valid settings", () => {
    const r = validateSettings({ temperature: 0.5, maxTokens: 256, topP: 0.9 });
    expect(r.ok).toBe(true);
  });
  it("rejects temperature > 2", () => {
    const r = validateSettings({ temperature: 5 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]?.path).toContain("temperature");
  });
  it("rejects negative maxTokens", () => {
    const r = validateSettings({ maxTokens: -1 });
    expect(r.ok).toBe(false);
  });
  it("accepts empty object (all optional)", () => {
    expect(validateSettings({}).ok).toBe(true);
  });
  it("coerces stop:string to stop:[string]", () => {
    const r = validateSettings({ stop: "###" } as unknown);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.stop).toEqual(["###"]);
  });
});
