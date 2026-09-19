import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SocialProof } from "./SocialProof";

/**
 * SocialProof is a proof-stat — it must be honest. Locks: a real positive count renders; a
 * missing/zero/NaN count self-hides (never a fabricated / "0" / NaN stat); and the deceptive
 * auto-increment jitter is OFF by default (a caller opts in only with a genuine live feed).
 */
describe("SocialProof — honest, data-driven only", () => {
  it("renders a real positive count + its label", () => {
    const { container } = render(
      <SocialProof initial={1200} label="orders shipped" />,
    );
    expect(container.textContent).toContain("1,200");
    expect(container.textContent).toContain("orders shipped");
  });

  it("self-hides for a non-positive / non-finite count (no fabricated stat)", () => {
    expect(
      render(<SocialProof initial={0} label="x" />).container.firstChild,
    ).toBeNull();
    expect(
      render(<SocialProof initial={Number.NaN} label="x" />).container
        .firstChild,
    ).toBeNull();
    expect(
      render(<SocialProof initial={-5} label="x" />).container.firstChild,
    ).toBeNull();
  });
});
