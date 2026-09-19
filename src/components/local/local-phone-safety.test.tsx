import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StickyPhoneCTA from "./StickyPhoneCTA";
import EmergencyBanner from "./EmergencyBanner";
import SpeedDial from "./SpeedDial";
import QuickActions from "./QuickActions";
import HeroWithPhoto from "./HeroWithPhoto";
import MapEmbed from "./MapEmbed";
import BookingEmbed from "./BookingEmbed";

/**
 * Click-to-call integrity across the whole `local/` building-block library — the class that
 * `lib/phone.ts` exists to kill. Each of these components receives a `phone` prop from the
 * site-generation domain-builder; an UNFILLED `{BUSINESS_PHONE}` token (or empty/digitless value)
 * must NEVER render a dead `tel:{BUSINESS_PHONE}` / `tel:` / `sms:` control the visitor taps and
 * nothing dials (the "doomed control" — a conversion killer + an embarrassingly-hard UX). They were
 * shipping raw `tel:${phone}` behind a truthy `if (phone)` guard that a `{token}` string passes;
 * all are now routed through telDigits/telHref. This locks the whole class.
 */
const TOKEN = "{BUSINESS_PHONE}";
const REAL = "(512) 555-0123";
const REAL_TEL = 'a[href="tel:5125550123"]';

/** A token/empty phone must leave ZERO dialable control in the DOM. */
function assertNoDeadCall(container: HTMLElement) {
  expect(container.querySelector('a[href^="tel:"]')).toBeNull();
  expect(container.querySelector('a[href^="sms:"]')).toBeNull();
  expect(container.innerHTML).not.toContain("tel:{");
  expect(container.innerHTML).not.toContain("sms:{");
}

describe("local/ click-to-call — no dead control on an unfilled phone token", () => {
  it("StickyPhoneCTA: token → self-hides (no dead bar); real → dialable bar", () => {
    assertNoDeadCall(render(<StickyPhoneCTA phone={TOKEN} />).container);
    const { container } = render(<StickyPhoneCTA phone={REAL} />);
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
  });

  it("EmergencyBanner: token → self-hides after-hours; real → dialable alert", () => {
    // businessHours={} → isOutsideBusinessHours() is always true → the after-hours banner is active.
    assertNoDeadCall(
      render(<EmergencyBanner emergencyPhone={TOKEN} businessHours={{}} />)
        .container,
    );
    const { container } = render(
      <EmergencyBanner emergencyPhone={REAL} businessHours={{}} />,
    );
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
  });

  it("SpeedDial: token → no Call action (FAB may hide); real → dialable Call in the menu", () => {
    assertNoDeadCall(render(<SpeedDial phone={TOKEN} />).container);
    const { container } = render(<SpeedDial phone={REAL} />);
    // Open the FAB menu, then the Call action's tel: link is in the DOM.
    const fab = container.querySelector('button[aria-label="Open quick actions"]');
    expect(fab).not.toBeNull();
    fireEvent.click(fab!);
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
  });

  it("QuickActions: token → no Call/Text tile; real → dialable tel: + sms:", () => {
    assertNoDeadCall(render(<QuickActions phone={TOKEN} />).container);
    const { container } = render(<QuickActions phone={REAL} />);
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
    expect(container.querySelector('a[href="sms:5125550123"]')).not.toBeNull();
  });

  it("HeroWithPhoto: token → no Call CTA; real → dialable hero CTA", () => {
    const base = { businessName: "Acme", tagline: "T", heroImage: "/h.jpg" };
    assertNoDeadCall(
      render(<HeroWithPhoto {...base} phone={TOKEN} />).container,
    );
    const { container } = render(<HeroWithPhoto {...base} phone={REAL} />);
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
  });

  it("MapEmbed: token → no phone row link; real → dialable phone row", () => {
    const base = {
      lat: 30,
      lng: -97,
      address: "900 E 11th St",
      directionsUrl: "https://maps.example",
    };
    assertNoDeadCall(render(<MapEmbed {...base} phone={TOKEN} />).container);
    const { container } = render(<MapEmbed {...base} phone={REAL} />);
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
  });

  it("BookingEmbed: token → no 'or call' link; real → dialable header link", () => {
    const base = { provider: "calendly" as const, embedUrl: "https://cal.example" };
    assertNoDeadCall(render(<BookingEmbed {...base} phone={TOKEN} />).container);
    const { container } = render(<BookingEmbed {...base} phone={REAL} />);
    expect(container.querySelector(REAL_TEL)).not.toBeNull();
  });
});
