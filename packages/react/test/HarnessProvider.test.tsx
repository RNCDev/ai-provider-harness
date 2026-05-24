import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HarnessProvider, useTransport } from "../src/context/HarnessProvider.js";
import { ServerTransport } from "../src/context/transport.js";

function Probe() {
  const t = useTransport();
  return <span>{t.constructor.name}</span>;
}

describe("HarnessProvider", () => {
  it("supplies a Transport via context", () => {
    const t = new ServerTransport({ baseUrl: "/x" });
    const { getByText } = render(
      <HarnessProvider transport={t}>
        <Probe />
      </HarnessProvider>,
    );
    expect(getByText("ServerTransport")).toBeInTheDocument();
  });
  it("throws if used outside provider", () => {
    expect(() => render(<Probe />)).toThrow(/HarnessProvider/);
  });
});
