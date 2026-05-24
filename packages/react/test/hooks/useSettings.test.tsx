import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { useSettings } from "../../src/hooks/useSettings.js";
import type { HarnessConfig } from "@aph/harness";

function makeT() {
  let cfg: HarnessConfig = { settings: { "gpt-4o": { temperature: 0.5 } } };
  return {
    listModels: async () => ({ providers: [] }),
    getConfig: async () => cfg,
    putConfig: async (c: HarnessConfig) => { cfg = c; return c; },
    keyStatus: async () => ({ hasKey: false as const }),
    putKey: async () => ({ hasKey: true as const }),
    deleteKey: async () => ({ hasKey: false as const }),
    validateKey: async () => ({ ok: true }),
    chat: async function*() {},
  };
}

describe("useSettings", () => {
  it("loads existing settings for a model", async () => {
    const t = makeT();
    const { result } = renderHook(() => useSettings("gpt-4o"), {
      wrapper: ({ children }) => <HarnessProvider transport={t as never}>{children}</HarnessProvider>,
    });
    await waitFor(() => expect(result.current.settings.temperature).toBe(0.5));
  });
  it("update merges and persists", async () => {
    const t = makeT();
    const { result } = renderHook(() => useSettings("gpt-4o"), {
      wrapper: ({ children }) => <HarnessProvider transport={t as never}>{children}</HarnessProvider>,
    });
    await waitFor(() => expect(result.current.settings.temperature).toBe(0.5));
    await act(async () => { await result.current.update({ maxTokens: 256 }); });
    expect(result.current.settings.temperature).toBe(0.5);
    expect(result.current.settings.maxTokens).toBe(256);
  });
});
