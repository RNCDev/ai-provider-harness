import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { useSelection } from "../../src/hooks/useSelection.js";
import type { HarnessConfig } from "@aph/harness";

function makeT() {
  let cfg: HarnessConfig = { selection: { providerId: "openai", modelId: "gpt-4o" } };
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

describe("useSelection", () => {
  it("loads then updates selection", async () => {
    const t = makeT();
    const { result } = renderHook(() => useSelection(), {
      wrapper: ({ children }) => <HarnessProvider transport={t as never}>{children}</HarnessProvider>,
    });
    await waitFor(() => expect(result.current.selection?.modelId).toBe("gpt-4o"));
    await act(async () => { await result.current.setSelection({ providerId: "anthropic", modelId: "claude-sonnet-4-6" }); });
    expect(result.current.selection?.providerId).toBe("anthropic");
  });
});
