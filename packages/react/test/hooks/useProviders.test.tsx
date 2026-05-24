import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { useProviders } from "../../src/hooks/useProviders.js";
import type { Transport } from "../../src/context/types.js";

function makeTransport(): Transport {
  return {
    async listModels() {
      return { providers: [
        { id: "openai", displayName: "OpenAI", models: [{ id: "gpt-4o", displayName: "GPT-4o", capabilities: { streaming: true } }] },
        { id: "anthropic", displayName: "Anthropic", models: [] },
      ] };
    },
    async getConfig() { return {}; },
    async putConfig(c) { return c; },
    async keyStatus() { return { hasKey: false }; },
    async putKey() { return { hasKey: true }; },
    async deleteKey() { return { hasKey: false }; },
    async validateKey() { return { ok: true }; },
    async *chat() {},
  };
}

const wrap = (t: Transport) => ({ children }: { children: ReactNode }) =>
  <HarnessProvider transport={t}>{children}</HarnessProvider>;

describe("useProviders", () => {
  it("returns provider list once loaded", async () => {
    const { result } = renderHook(() => useProviders(), { wrapper: wrap(makeTransport()) });
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.providers.length).toBe(2);
  });
});
