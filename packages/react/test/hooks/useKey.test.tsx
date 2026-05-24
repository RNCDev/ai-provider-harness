import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { useKey } from "../../src/hooks/useKey.js";
import type { Transport } from "../../src/context/types.js";

function makeT(): Transport {
  const keys = new Map<string, string>();
  return {
    listModels: async () => ({ providers: [] }),
    getConfig: async () => ({}),
    putConfig: async (c) => c,
    keyStatus: async (p) => ({ hasKey: keys.has(p) }),
    putKey: async (p, k) => { keys.set(p, k); return { hasKey: true }; },
    deleteKey: async (p) => { keys.delete(p); return { hasKey: false }; },
    validateKey: async () => ({ ok: true }),
    async *chat() {},
  };
}

describe("useKey", () => {
  it("hasKey toggles after setKey and deleteKey", async () => {
    const { result } = renderHook(() => useKey("openai"), {
      wrapper: ({ children }) => <HarnessProvider transport={makeT()}>{children}</HarnessProvider>,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasKey).toBe(false);
    await act(async () => { await result.current.setKey("sk"); });
    expect(result.current.hasKey).toBe(true);
    await act(async () => { await result.current.deleteKey(); });
    expect(result.current.hasKey).toBe(false);
  });
  it("validate is callable", async () => {
    const { result } = renderHook(() => useKey("openai"), {
      wrapper: ({ children }) => <HarnessProvider transport={makeT()}>{children}</HarnessProvider>,
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const r = await result.current.validate();
    expect(r.ok).toBe(true);
  });
});
