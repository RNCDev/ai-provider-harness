import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { useChat } from "../../src/hooks/useChat.js";
import type { Transport } from "../../src/context/types.js";

function makeT(): Transport {
  return {
    listModels: async () => ({ providers: [] }),
    getConfig: async () => ({ selection: { providerId: "openai", modelId: "gpt-4o" } }),
    putConfig: async (c) => c,
    keyStatus: async () => ({ hasKey: true }),
    putKey: async () => ({ hasKey: true }),
    deleteKey: async () => ({ hasKey: false }),
    validateKey: async () => ({ ok: true }),
    async *chat() {
      yield { type: "text", text: "Hello" };
      yield { type: "text", text: " world" };
      yield { type: "finish", finishReason: "stop" };
    },
  };
}

describe("useChat", () => {
  it("send populates messages with assistant streaming text", async () => {
    const { result } = renderHook(() => useChat(), {
      wrapper: ({ children }) => <HarnessProvider transport={makeT()}>{children}</HarnessProvider>,
    });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(async () => { await result.current.send("hi"); });
    const last = result.current.messages.at(-1);
    expect(last?.role).toBe("assistant");
    expect(last?.content).toBe("Hello world");
    expect(result.current.status).toBe("idle");
  });
});
