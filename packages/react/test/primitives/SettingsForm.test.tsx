import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { SettingsForm } from "../../src/primitives/SettingsForm.js";
import type { HarnessConfig } from "@aph/harness";

function makeT() {
  let cfg: HarnessConfig = {
    selection: { providerId: "openai", modelId: "gpt-4o" },
    settings: { "gpt-4o": { temperature: 0.5 } },
  };
  return {
    listModels: async () => ({ providers: [] }),
    getConfig: async () => cfg,
    putConfig: async (c: HarnessConfig) => { cfg = c; return c; },
    keyStatus: async () => ({ hasKey: false as const }),
    putKey: async () => ({ hasKey: true as const }),
    deleteKey: async () => ({ hasKey: false as const }),
    validateKey: async () => ({ ok: true }),
    async *chat() {},
  };
}

describe("SettingsForm", () => {
  it("renders fields and writes through on change", async () => {
    render(
      <HarnessProvider transport={makeT() as never}>
        <SettingsForm.Root>
          <SettingsForm.Field name="temperature">
            <SettingsForm.Label>Temp</SettingsForm.Label>
            <SettingsForm.Control />
          </SettingsForm.Field>
          <SettingsForm.Field name="maxTokens">
            <SettingsForm.Label>Max tokens</SettingsForm.Label>
            <SettingsForm.Control />
          </SettingsForm.Field>
        </SettingsForm.Root>
      </HarnessProvider>,
    );
    const temp = await screen.findByLabelText("Temp") as HTMLInputElement;
    await waitFor(() => expect(temp.value).toBe("0.5"));
    await userEvent.clear(temp);
    await userEvent.type(temp, "0.8");
    expect(temp.value).toBe("0.8");
  });
});
