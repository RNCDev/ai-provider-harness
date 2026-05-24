import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { ModelSelect } from "../../src/primitives/ModelSelect.js";
import type { Transport } from "../../src/context/types.js";
import type { HarnessConfig } from "@aph/harness";

function makeT(): Transport {
  let cfg: HarnessConfig = { selection: { providerId: "openai", modelId: "gpt-4o" } };
  return {
    listModels: async () => ({ providers: [
      { id: "openai", displayName: "OpenAI", models: [
        { id: "gpt-4o", displayName: "GPT-4o", capabilities: {} },
        { id: "gpt-4o-mini", displayName: "GPT-4o Mini", capabilities: {} },
      ] },
    ] }),
    getConfig: async () => cfg,
    putConfig: async (c) => { cfg = c as HarnessConfig; return c; },
    keyStatus: async () => ({ hasKey: false }),
    putKey: async () => ({ hasKey: true }),
    deleteKey: async () => ({ hasKey: false }),
    validateKey: async () => ({ ok: true }),
    async *chat() {},
  };
}

describe("ModelSelect", () => {
  it("shows models for current provider and updates modelId on change", async () => {
    render(
      <HarnessProvider transport={makeT()}>
        <ModelSelect aria-label="Model" />
      </HarnessProvider>,
    );
    const select = await screen.findByLabelText("Model") as HTMLSelectElement;
    await waitFor(() => expect(select.options.length).toBeGreaterThan(1));
    await userEvent.selectOptions(select, "gpt-4o-mini");
    expect(select.value).toBe("gpt-4o-mini");
  });
});
