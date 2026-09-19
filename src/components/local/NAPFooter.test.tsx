import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NAPFooter from "./NAPFooter";

/**
 * NAPFooter is the delivered site's primary conversion surface — a visitor taps the
 * address to NAVIGATE, the phone to CALL. Two embarrassingly-easy contracts locked here:
 *   1. the address link is ONE-TAP DIRECTIONS (`maps/dir` + `destination=`), never a
 *      `maps/search` results page — it also fires a `direction_click` event, so a search
 *      URL was a semantic lie the visitor felt as a dead-end.
 *   2. the phone link is a dialer-clean `tel:` (digits + `+` only) like every sibling —
 *      spaces/dashes in a `tel:` href fail some mobile dialers.
 */

const props = {
  businessName: "Salt & Straw",
  address: "838 NW 23rd Ave, Portland, OR 97210",
  phone: "+1 (503) 208-2054",
  email: "hello@saltandstraw.com",
  hours: { Monday: "11am–11pm", Tuesday: "11am–11pm" },
  socialLinks: [
    { platform: "instagram", url: "https://instagram.com/saltandstraw" },
  ],
};

describe("NAPFooter — visitor conversion links (embarrassingly-easy)", () => {
  it("address opens ONE-TAP DIRECTIONS (maps/dir + destination), never a search page", () => {
    const { container } = render(<NAPFooter {...props} />);
    const addr = container.querySelector(
      'a[itemprop="address"]',
    ) as HTMLAnchorElement;
    expect(addr).not.toBeNull();
    const href = addr.getAttribute("href") ?? "";
    expect(href).toContain(
      "https://www.google.com/maps/dir/?api=1&destination=",
    );
    expect(href).toContain(encodeURIComponent(props.address));
    // regression: NEVER the search-results variant (mismatched the direction_click event)
    expect(href).not.toContain("/maps/search");
    // opens safely in a new tab
    expect(addr.getAttribute("target")).toBe("_blank");
    expect(addr.getAttribute("rel")).toContain("noopener");
  });

  it("phone is a dialer-clean click-to-call (digits + '+' only)", () => {
    const { container } = render(<NAPFooter {...props} />);
    const tel = container.querySelector('a[href^="tel:"]') as HTMLAnchorElement;
    expect(tel).not.toBeNull();
    // "+1 (503) 208-2054" → "+15032082054" (no spaces/parens/dashes)
    expect(tel.getAttribute("href")).toBe("tel:+15032082054");
    // the VISIBLE number keeps its human formatting (only the href is stripped)
    expect(tel.textContent).toContain(props.phone);
  });

  it("email is a mailto: link", () => {
    const { container } = render(<NAPFooter {...props} />);
    const mail = container.querySelector(
      'a[href^="mailto:"]',
    ) as HTMLAnchorElement;
    expect(mail?.getAttribute("href")).toBe(`mailto:${props.email}`);
  });

  it("carries schema.org LocalBusiness microdata (name + telephone + address)", () => {
    const { container } = render(<NAPFooter {...props} />);
    expect(
      container.querySelector('[itemtype="https://schema.org/LocalBusiness"]'),
    ).not.toBeNull();
    expect(container.querySelector('[itemprop="name"]')?.textContent).toContain(
      "Salt & Straw",
    );
    expect(container.querySelector('[itemprop="telephone"]')).not.toBeNull();
  });
});
