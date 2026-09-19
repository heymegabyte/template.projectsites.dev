import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * HomeContact NAP render-honesty — the conversion + local-SEO floor on the SINGLE
 * highest-traffic surface (the homepage of every delivered site). Locks four invariants:
 *   A. the lead FORM always renders (a homepage conversion surface exists even bare);
 *   B. an empty brand shows the reassurance FALLBACK, never a dead tel:/mailto: or a {TOKEN};
 *   C. a real NAP renders correct tel:/mailto:/maps links (no dead href);
 *   D. a filled-but-DIGITLESS phone ("Call for hours") renders NO Call control — the weak
 *      `phone ? tel:… : ''` would have shipped a dead `href="tel:"` (doomed control); the
 *      shared telDigits(≥7-digit) guard drops it.
 *
 * brand.business is read at render time inside HomeContact, so mock @/brand as a mutable
 * object; stub the heavy ContactForm so this stays a focused unit. `vi.hoisted` builds the
 * shared state BEFORE the hoisted vi.mock factory runs (else a top-level ref hits the TDZ).
 */
const { biz, setBiz } = vi.hoisted(() => {
  const EMPTY = {
    name: "",
    shortName: "",
    tagline: "",
    description: "",
    url: "",
    businessClass: "organization",
    email: "",
    phone: "",
    address: "",
    hours: "",
  };
  const biz = { ...EMPTY };
  const setBiz = (partial: Partial<typeof EMPTY>) =>
    Object.assign(biz, EMPTY, partial);
  return { biz, setBiz };
});

vi.mock("@/brand", () => ({
  brand: { business: biz },
  featureOn: () => false,
}));
vi.mock("@/components/ContactForm", () => ({
  ContactForm: () => <form data-testid="lead-form" />,
}));

import { HomeContact } from "./Home";

beforeEach(() => setBiz({}));

describe("HomeContact — NAP render honesty (highest-traffic homepage surface)", () => {
  it("A. ALWAYS renders the lead form, even with an empty brand", () => {
    const { getByTestId } = render(<HomeContact />);
    expect(getByTestId("lead-form")).toBeTruthy();
  });

  it("B. empty brand → fallback message, never a dead tel:/mailto: link or a {TOKEN}", () => {
    const { container } = render(<HomeContact />);
    const address = container.querySelector("address");
    expect(address).not.toBeNull();
    // No dialable / mail / maps anchors at all when there's no real NAP data.
    expect(address!.querySelector('a[href^="tel:"]')).toBeNull();
    expect(address!.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(address!.querySelector("a")).toBeNull();
    // Reassurance copy renders instead of an empty column.
    expect(address!.textContent).toContain("Prefer to talk");
    // No unfilled {TOKEN} leaks into the NAP.
    expect(address!.textContent).not.toMatch(/\{[A-Z_]+\}/);
  });

  it("C. real NAP → correct tel:/mailto:/maps links, no dead hrefs", () => {
    setBiz({
      name: "Franklin Barbecue",
      phone: "(512) 653-1187",
      email: "hi@franklinbbq.com",
      address: "900 E 11th St, Austin, TX 78702",
      hours: "Tue-Sun 11am-3pm",
    });
    const { container } = render(<HomeContact />);
    const address = container.querySelector("address")!;
    expect(address.querySelector('a[href="tel:5126531187"]')).not.toBeNull();
    expect(
      address.querySelector('a[href="mailto:hi@franklinbbq.com"]'),
    ).not.toBeNull();
    expect(
      address.querySelector('a[href^="https://www.google.com/maps/dir/"]'),
    ).not.toBeNull();
    // No dead controls slipped in.
    expect(address.querySelector('a[href="tel:"]')).toBeNull();
    expect(address.querySelector('a[href="#"]')).toBeNull();
    // Hours row renders its real value.
    expect(address.textContent).toContain("Tue-Sun 11am-3pm");
  });

  it("D. filled-but-digitless phone renders NO dead Call link, falls back", () => {
    setBiz({ name: "Some Shop", phone: "Call for hours" });
    const { container } = render(<HomeContact />);
    const address = container.querySelector("address")!;
    // telDigits('Call for hours') === '' → no Call row; with no other NAP the fallback shows.
    expect(address.querySelector('a[href^="tel:"]')).toBeNull();
    expect(address.textContent).toContain("Prefer to talk");
  });
});
