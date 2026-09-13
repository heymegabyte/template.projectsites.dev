import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * The `restaurant` content pack is the ONLY food pack, so EVERY food vertical inherits it —
 * including QUICKSERVE counters (ice cream, coffee, bakery, deli, juice bar, food truck) that
 * take no reservations and seat no tables. Its most-visible tokens used to hard-assume a
 * full-service restaurant ("Reserve a table" CTA + button, "Reservations welcome" badge,
 * "Reserve" process step, "Do you take reservations?" FAQ, "come for a great meal" meta) — so an
 * ice-cream shop shipped a Reserve-a-table site (real defect, seen on jenis-splendid-ice-creams).
 * commerceModeFor() only re-seeds the hero CTA; these pack tokens are the shared fallback.
 *
 * Fix (AL-445): the CORE, most-seen tokens read food-spectrum-neutral — walk-ins / takeout /
 * order-ahead / "See the menu" are ACCURATE for full-service too (they do all of those), so it's
 * inclusive, not diluted; hospitality-mode sites still get "Reserve a table" via the seeded CTA.
 * This guards those tokens against regressing back to reservation-only wording.
 *
 * (Residual reservation copy remains in less-visible DEEP tokens — CONTACT_*, FAQ_BILL_*,
 * SERVICE_5 "Private Events", ABOUT_APPROACH — a tracked follow-on; this locks the core set.)
 */
// vitest runs from the repo root, so the example pack is a cwd-relative read (robust — some
// vitest transforms leave import.meta.url as a non-file scheme, which breaks new URL(../…)).
const pack = JSON.parse(
  readFileSync(resolve(process.cwd(), 'examples/_content.restaurant.json'), 'utf8'),
) as Record<string, string>;

// Full-service-ONLY phrases that read wrong on a quickserve counter.
const RESERVATION_ONLY = /reserve a table|reservations welcome|book (?:your|a) table|do you take reservations|come for a great meal/i;

describe('restaurant content pack — core tokens are food-spectrum-neutral (quickserve-safe)', () => {
  // The highest-visibility, most-rendered tokens: hero/CTA buttons, the trust badge, the first
  // process step + FAQ, and the SEO meta description (search-result + social-share visible).
  const CORE_TOKENS = [
    'HERO_CTA',
    'HERO_SECONDARY_CTA',
    'HERO_SUBHEADLINE',
    'TRUST_BADGE_2',
    'PROCESS_1_TITLE',
    'PROCESS_1_DESCRIPTION',
    'FAQ_1_Q',
    'CTA_BUTTON',
    'CTA_DESCRIPTION',
    'SEO_DESCRIPTION',
    'FEATURE_6_TITLE',
    'FEATURE_6_DESCRIPTION',
  ];

  it('no core token hard-assumes reservations / a table / a full-service meal', () => {
    for (const key of CORE_TOKENS) {
      const val = pack[key] ?? '';
      expect(val, `${key} present`).toBeTruthy();
      expect(RESERVATION_ONLY.test(val), `${key} must be quickserve-safe — got "${val}"`).toBe(false);
    }
  });

  it('SEO_DESCRIPTION stays keyword-rich + in the 120–156 char meta window', () => {
    const d = pack.SEO_DESCRIPTION ?? '';
    expect(d.length).toBeGreaterThanOrEqual(120);
    expect(d.length).toBeLessThanOrEqual(156);
    expect(/food|menu|fresh|made-from-scratch/i.test(d), 'still reads as a food business').toBe(true);
  });
});
