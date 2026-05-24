import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { useModels } from "../../src/hooks/useModels.js";
import type { Transport } from "../../src/context/types.js";

function makeTransport(): Transport {
  return {
    async listModels() {
      return { providers: [
        { id: "openai", displayName: "OpenAI", models: [{ id: "gpt-4o", displayName: "GPT-4o", capabilities: {} }] },
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

describe("useModels", () => {
  it("returns models for a given provider", async () => {
    const { result } = renderHook(() => useModels("openai"), { wrapper: wrap(makeTransport()) });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.models[0]?.id).toBe("gpt-4o");
  });
});
