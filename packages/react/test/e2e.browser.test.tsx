import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryStorageAdapter, OpenAIProvider, Catalog } from "@aph/harness";
import { HarnessProvider } from "../src/context/HarnessProvider.js";
import { BrowserTransport } from "../src/context/transport.js";
import { ProviderSelect } from "../src/primitives/ProviderSelect.js";
import { KeyForm } from "../src/primitives/KeyForm.js";

afterEach(() => vi.restoreAllMocks());

describe("browser-mode e2e", () => {
  it("user picks provider, pastes key, status shows Key stored", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    const transport = new BrowserTransport({
      ownerId: "demo",
      storage: new MemoryStorageAdapter(),
      providers: { openai: new OpenAIProvider() },
      catalog: new Catalog({ store: new Map() }),
    });

    render(
      <HarnessProvider transport={transport}>
        <ProviderSelect aria-label="Provider" />
        <KeyForm.Root providerId="openai">
          <KeyForm.Status />
          <KeyForm.Input aria-label="Key" />
        </KeyForm.Root>
      </HarnessProvider>,
    );

    await waitFor(() => expect(screen.getByLabelText("Provider")).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText("Provider"), "openai");
    await userEvent.type(screen.getByLabelText("Key"), "sk-test");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Key stored")).toBeInTheDocument());
  });
});
