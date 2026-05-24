import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HarnessProvider } from "../../src/context/HarnessProvider.js";
import { KeyForm } from "../../src/primitives/KeyForm.js";
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

describe("KeyForm", () => {
  it("shows No key initially, Key stored after save", async () => {
    render(
      <HarnessProvider transport={makeT()}>
        <KeyForm.Root providerId="openai">
          <KeyForm.Status />
          <KeyForm.Input aria-label="Key" />
        </KeyForm.Root>
      </HarnessProvider>,
    );
    await waitFor(() => expect(screen.getByText("No key")).toBeInTheDocument());
    await userEvent.type(screen.getByLabelText("Key"), "sk-abc");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Key stored")).toBeInTheDocument());
  });

  it("validate button shows OK result", async () => {
    const t = makeT();
    await t.putKey("openai", "sk");
    render(
      <HarnessProvider transport={t}>
        <KeyForm.Root providerId="openai">
          <KeyForm.ValidateButton />
        </KeyForm.Root>
      </HarnessProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Validate" }));
    await waitFor(() => expect(screen.getByText("OK")).toBeInTheDocument());
  });
});
