import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { ProviderSelect } from "../../src/primitives/ProviderSelect.js";
import type { Transport } from "../../src/context/types.js";

function makeT(): Transport {
  let cfg = {};
  return {
    listModels: async () => ({ providers: [
      { id: "openai", displayName: "OpenAI", models: [] },
      { id: "anthropic", displayName: "Anthropic", models: [] },
    ] }),
    getConfig: async () => cfg,
    putConfig: async (c) => { cfg = c; return c; },
    keyStatus: async () => ({ hasKey: false }),
    putKey: async () => ({ hasKey: true }),
    deleteKey: async () => ({ hasKey: false }),
    validateKey: async () => ({ ok: true }),
    async *chat() {},
  };
}

describe("ProviderSelect", () => {
  it("renders an option per provider and persists selection on change", async () => {
    render(
      <HarnessProvider transport={makeT()}>
        <ProviderSelect aria-label="Provider" />
      </HarnessProvider>,
    );
    const select = await screen.findByLabelText("Provider");
    expect(select).toBeInTheDocument();
    await userEvent.selectOptions(select, "anthropic");
    expect((select as HTMLSelectElement).value).toBe("anthropic");
  });
});
