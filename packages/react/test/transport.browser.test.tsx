import { describe, expect, it } from "vitest";
import { MemoryStorageAdapter, OpenAIProvider, Catalog } from "@aph/harness";
import { BrowserTransport } from "../src/context/transport.js";

describe("BrowserTransport", () => {
  it("uses provided registry + storage for config + keys", async () => {
    const storage = new MemoryStorageAdapter();
    const t = new BrowserTransport({
      ownerId: "u1",
      storage,
      providers: { openai: new OpenAIProvider() },
      catalog: new Catalog({ store: new Map() }),
    });
    await t.putKey("openai", "sk");
    expect(await t.keyStatus("openai")).toEqual({ hasKey: true });
    await t.putConfig({ selection: { providerId: "openai", modelId: "gpt-4o" } });
    expect((await t.getConfig()).selection?.modelId).toBe("gpt-4o");
  });
});
