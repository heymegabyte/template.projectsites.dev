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
 * AL-445 cleared the FULL probe-flagged set (core + contact + faq-bill + service copy). Softer,
 * non-probe-flagged full-service phrasing remains ("private dining", a "Reservations or walk-in"
 * service title) — acceptable + true for full-service, a soft follow-on. This guard keeps the
 * probe-flagged set at zero pack-wide.
 */
// vitest runs from the repo root, so the example pack is a cwd-relative read (robust — some
// vitest transforms leave import.meta.url as a non-file scheme, which breaks new URL(../…)).
const pack = JSON.parse(
  readFileSync(resolve(process.cwd(), 'examples/_content.restaurant.json'), 'utf8'),
) as Record<string, string>;

// The EXACT affirmative reservation regex the prod probe (projectsites
// e2e/site-quality/verify-conversion-framing.mjs) flags on a quickserve site — keep this in
// sync so the template guard and the deployed-site gate agree on what "quickserve-safe" means.
const RESERVATION_ONLY =
  /\b(reserve a table|reservations?\s+welcome|book (?:a|your) table|easy reservations?|make a reservation|table reservations?|come for a great meal)\b/i;

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

  it('NO token anywhere in the pack carries a probe-flagged reservation phrase', () => {
    // Whole-pack scan (not just the core set) — a rebuilt quickserve site renders many of these
    // tokens (contact, faq-bill, service descriptions), so ANY flagged phrase would trip the prod
    // conversion-framing probe. AL-445 cleared the full set; this keeps it at zero.
    const offenders = Object.entries(pack)
      .filter(([, v]) => typeof v === 'string' && RESERVATION_ONLY.test(v))
      .map(([k]) => k);
    expect(offenders, `tokens with reservation-only copy: ${offenders.join(', ') || 'none'}`).toEqual([]);
  });

  it('SEO_DESCRIPTION stays keyword-rich + in the 120–156 char meta window', () => {
    const d = pack.SEO_DESCRIPTION ?? '';
    expect(d.length).toBeGreaterThanOrEqual(120);
    expect(d.length).toBeLessThanOrEqual(156);
    expect(/food|menu|fresh|made-from-scratch/i.test(d), 'still reads as a food business').toBe(true);
  });

  // AL-450: the fast-path hero IMAGE is the pack default (the worker doesn't seed HERO_IMAGE_URL),
  // so a formal "restaurant dining room" hero shipped on every quickserve food site (Verve coffee
  // got a full-service dining room). The hero must be food-spectrum-neutral — a warm cafe/counter
  // scene that fits coffee/bakery/deli AND casual restaurants. Guards against regressing to the
  // dining-room framing. (Image itself is Unsplash + visually inspected at bake time.)
  it('hero image is food-spectrum-neutral (not a full-service dining room)', () => {
    const alt = pack.HERO_IMAGE_ALT ?? '';
    const url = pack.HERO_IMAGE_URL ?? '';
    expect(alt, 'HERO_IMAGE_ALT present').toBeTruthy();
    expect(url.startsWith('https://images.unsplash.com/'), 'hero is an Unsplash URL').toBe(true);
    expect(/dining room|fine dining|restaurant interior/i.test(alt), `hero alt must not be full-service-only — got "${alt}"`).toBe(false);
    // the retired dining-room photo must not sneak back into the baked URL
    expect(url.includes('photo-1517248135467'), 'old dining-room hero photo is retired').toBe(false);
  });
});
