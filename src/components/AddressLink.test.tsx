import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AddressLink } from "./AddressLink";

/**
 * AddressLink wraps an address in a one-tap Google Maps DIRECTIONS link. It must NEVER render a
 * broken directions link on placeholder data — an empty / unfilled-{token} address would ship
 * `destination=%7BADDRESS%7D` + a leaked "{ADDRESS}" label + "Get directions to {ADDRESS}" aria.
 */
describe("AddressLink", () => {
  it("a real address → a one-tap maps/dir directions link with the address text + aria", () => {
    const addr = "838 NW 23rd Ave, Portland, OR 97210";
    const { container } = render(<AddressLink address={addr} />);
    const a = container.querySelector("a") as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`,
    );
    expect(a.getAttribute("aria-label")).toBe(`Get directions to ${addr}`);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.textContent).toContain(addr);
  });

  it("renders NOTHING for an unfilled {token} or empty address (no broken link, no leak)", () => {
    expect(
      render(<AddressLink address="{ADDRESS}" />).container.firstChild,
    ).toBeNull();
    expect(render(<AddressLink address="" />).container.firstChild).toBeNull();
    expect(
      render(<AddressLink address="   " />).container.firstChild,
    ).toBeNull();
  });
});
