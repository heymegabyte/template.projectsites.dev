import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LogoCloud } from "./LogoCloud";

/**
 * LogoCloud must never render a dead `<a href="#">` for a logo with no real link — a linkless logo
 * renders as a non-interactive mark instead. Locks that regression in both branches (grid variant).
 */
describe("LogoCloud — no dead logo links", () => {
  it('a logo with NO href renders a non-interactive mark, never <a href="#">', () => {
    const { container } = render(
      <LogoCloud logos={[{ name: "Acme" }]} variant="grid" />,
    );
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(container.querySelector("a")).toBeNull(); // no anchor at all — rendered as a span
    expect(container.textContent).toContain("Acme");
  });

  it("a logo WITH a real external href renders a working link", () => {
    const { container } = render(
      <LogoCloud
        logos={[{ name: "Beta", href: "https://beta.example" }]}
        variant="grid"
      />,
    );
    expect(container.querySelector('a[href="#"]')).toBeNull();
    expect(
      container.querySelector('a[href="https://beta.example"]'),
    ).not.toBeNull();
  });
});
