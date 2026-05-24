import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Slot } from "../../src/primitives/as-child.js";

describe("Slot", () => {
  it("clones child and merges props (including className)", () => {
    const { container } = render(
      <Slot className="a" data-x="1">
        <button className="b" type="button">click</button>
      </Slot>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.className).toBe("a b");
    expect(btn.getAttribute("data-x")).toBe("1");
  });
});
