/**
 * Tests the JSON-LD graph builder in `src/lib/businessSchema.ts`.
 */
import { describe, it, expect } from 'vitest';
import { buildBusinessJsonLd, buildSiteJsonLd, isLocalBusinessClass, parseAddress, parseHours, hoursToWeek, isOpenAt, formatTime12, describeToday } from '@/lib/businessSchema';

const baseProfile = {
  name: 'Acme Inc.',
  description: 'We make widgets.',
  url: 'https://acme.example',
  businessClass: 'saas' as const,
  email: 'hello@acme.example',
};

describe('buildBusinessJsonLd', () => {
  it('emits SoftwareApplication for saas businessClass', () => {
    const json = buildBusinessJsonLd(baseProfile);
    expect(json['@type']).toBe('SoftwareApplication');
    expect(json['@context']).toBe('https://schema.org');
    expect(json.name).toBe('Acme Inc.');
  });

  it('emits Restaurant for restaurant businessClass with full local fields', () => {
    const json = buildBusinessJsonLd({
      ...baseProfile,
      businessClass: 'restaurant',
      address: { streetAddress: '123 Main', addressLocality: 'Anchorage', addressRegion: 'AK', postalCode: '99501', addressCountry: 'US' },
      geo: { latitude: 61.2, longitude: -149.9 },
      openingHours: ['Tu-Su 06:00-15:00'],
      priceRange: '$',
    });
    expect(json['@type']).toBe('Restaurant');
    expect(json.geo).toEqual(expect.objectContaining({ '@type': 'GeoCoordinates' }));
    expect(json.openingHoursSpecification).toBeDefined();
    expect(json.priceRange).toBe('$');
  });

  it('omits geo + openingHours for non-local businesses', () => {
    const json = buildBusinessJsonLd({
      ...baseProfile,
      businessClass: 'saas',
      geo: { latitude: 0, longitude: 0 },
      openingHours: ['Mo-Fr 09:00-17:00'],
      priceRange: '$$',
    });
    expect(json.geo).toBeUndefined();
    expect(json.openingHoursSpecification).toBeUndefined();
    expect(json.priceRange).toBeUndefined();
  });

  it('includes founder Person sub-object when provided', () => {
    const json = buildBusinessJsonLd({
      ...baseProfile,
      founder: { name: 'Jane Doe', jobTitle: 'CEO', sameAs: ['https://x.com/jane'] },
    });
    expect((json.founder as Record<string, unknown>)['@type']).toBe('Person');
    expect((json.founder as Record<string, unknown>).name).toBe('Jane Doe');
    expect((json.founder as Record<string, unknown>).jobTitle).toBe('CEO');
  });

  it('includes sameAs when real social URLs are provided, omits it when empty', () => {
    const withSocial = buildBusinessJsonLd({ ...baseProfile, sameAs: ['https://facebook.com/acme', 'https://x.com/acme'] });
    expect(withSocial.sameAs).toEqual(['https://facebook.com/acme', 'https://x.com/acme']);
    const noSocial = buildBusinessJsonLd({ ...baseProfile, sameAs: [] });
    expect(noSocial.sameAs).toBeUndefined();
  });

  it('maps every loop vertical to its specific LocalBusiness subtype', () => {
    const cases: Record<string, string> = {
      dental: 'Dentist',
      medical: 'MedicalBusiness',
      wellness: 'HealthAndBeautyBusiness',
      'local-service': 'HomeAndConstructionBusiness',
      'real-estate': 'RealEstateAgent',
      fitness: 'ExerciseGym',
      restaurant: 'Restaurant',
      legal: 'LegalService',
      nonprofit: 'NGO',
    };
    for (const [cls, type] of Object.entries(cases)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(buildBusinessJsonLd({ ...baseProfile, businessClass: cls as any })['@type']).toBe(type);
    }
  });

  it('treats dental/wellness/local-service/real-estate/fitness/legal/nonprofit as LOCAL (geo emits)', () => {
    for (const cls of ['dental', 'wellness', 'local-service', 'real-estate', 'fitness', 'legal', 'nonprofit'] as const) {
      const json = buildBusinessJsonLd({ ...baseProfile, businessClass: cls, geo: { latitude: 1, longitude: 2 } });
      expect(json.geo, `${cls} should be local`).toBeDefined();
    }
  });
});

describe('parseAddress', () => {
  it('parses "Street, City, ST ZIP" into a structured PostalAddress', () => {
    expect(parseAddress('300 S 16th St, Omaha, NE 68102')).toEqual({
      streetAddress: '300 S 16th St', addressLocality: 'Omaha', addressRegion: 'NE', postalCode: '68102', addressCountry: 'US',
    });
  });
  it('handles a partial "Street, City" (no state/zip)', () => {
    expect(parseAddress('123 Main St, Springfield')).toEqual({
      streetAddress: '123 Main St', addressLocality: 'Springfield', addressRegion: '', postalCode: '', addressCountry: 'US',
    });
  });
  it('returns undefined for online-only / empty / single-token', () => {
    expect(parseAddress('Online')).toBeUndefined();
    expect(parseAddress('')).toBeUndefined();
    expect(parseAddress(undefined)).toBeUndefined();
  });
});

describe('parseHours', () => {
  it('parses a single "Mon–Fri 9am–5pm" clause into one OpeningHoursSpecification', () => {
    expect(parseHours('Mon–Fri 9am–5pm')).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '17:00' },
    ]);
  });
  it('expands a wrap-around "Wed–Sun 7am–3pm" range and SKIPS the "Closed Mon & Tue" note', () => {
    expect(parseHours('Wed–Sun 7am–3pm · Closed Mon & Tue')).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '07:00', closes: '15:00' },
    ]);
  });
  it('emits one spec per "·"-separated clause and drops the closed note', () => {
    expect(parseHours('Tue–Fri 8am–5pm · Sat 9am–2pm · Closed Sun & Mon')).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday'], opens: '09:00', closes: '14:00' },
    ]);
  });
  it('skips 24/7 + emergency notes, keeping only the real hours', () => {
    expect(parseHours('Mon–Sat 8am–6pm · 24/7 emergency')).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '08:00', closes: '18:00' },
    ]);
  });
  it('converts 12h→24h correctly across the noon/midnight boundary', () => {
    expect(parseHours('Mon 12am–12pm')).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday'], opens: '00:00', closes: '12:00' },
    ]);
  });
  it('returns [] for by-appointment / empty / unparseable input', () => {
    expect(parseHours('By appointment only')).toEqual([]);
    expect(parseHours('')).toEqual([]);
    expect(parseHours(undefined)).toEqual([]);
    expect(parseHours('call us anytime')).toEqual([]);
  });
});

describe('hoursToWeek', () => {
  it('builds a Mon→Sun grid with closed days for a single range', () => {
    const w = hoursToWeek('Mon–Fri 9am–5pm');
    expect(w).toHaveLength(7);
    expect(w[0]).toEqual({ day: 'Monday', opens: '09:00', closes: '17:00', closed: false });
    expect(w[5]).toEqual({ day: 'Saturday', closed: true });
    expect(w[6]).toEqual({ day: 'Sunday', closed: true });
  });
  it('marks the un-named days closed for a wrap-around range', () => {
    const w = hoursToWeek('Wed–Sun 7am–3pm · Closed Mon & Tue');
    expect(w.find((d) => d.day === 'Monday')?.closed).toBe(true);
    expect(w.find((d) => d.day === 'Wednesday')).toEqual({ day: 'Wednesday', opens: '07:00', closes: '15:00', closed: false });
    expect(w.find((d) => d.day === 'Sunday')?.closed).toBe(false);
  });
  it('returns [] for by-appointment / unparseable (caller falls back to raw text)', () => {
    expect(hoursToWeek('By appointment only')).toEqual([]);
    expect(hoursToWeek(undefined)).toEqual([]);
  });
});

describe('isOpenAt', () => {
  it('is open inside the window, closed outside, and closed on a closed day', () => {
    expect(isOpenAt('Mon–Fri 9am–5pm', 'Monday', 10 * 60)).toBe(true); // 10:00
    expect(isOpenAt('Mon–Fri 9am–5pm', 'Monday', 8 * 60)).toBe(false); // 08:00 before open
    expect(isOpenAt('Mon–Fri 9am–5pm', 'Sunday', 10 * 60)).toBe(false); // closed day
  });
  it('treats opens as inclusive and closes as exclusive', () => {
    expect(isOpenAt('Mon–Fri 9am–5pm', 'Monday', 9 * 60)).toBe(true); // 09:00 exactly → open
    expect(isOpenAt('Mon–Fri 9am–5pm', 'Monday', 17 * 60)).toBe(false); // 17:00 exactly → closed
  });
});

describe('formatTime12', () => {
  it.each([
    ['08:00', '8am'],
    ['14:30', '2:30pm'],
    ['00:00', '12am'],
    ['12:00', '12pm'],
    ['17:00', '5pm'],
    ['09:15', '9:15am'],
  ])('%s → %s', (input, expected) => {
    expect(formatTime12(input)).toBe(expected);
  });
});

describe('buildSiteJsonLd (AL-522: client emits ONLY the rich business entity)', () => {
  // The site-level WebSite / WebPage / BreadcrumbList are injected SERVER-SIDE by the
  // worker shell (build_validators). Re-emitting them client-side too produced DUPLICATE
  // entities (the server blocks carry no @id, these did → Google couldn't merge). So the
  // client returns ONLY the LocalBusiness/Organization entity carrying NAP/geo/hours.
  it('returns exactly one node — the rich business entity', () => {
    const graph = buildSiteJsonLd(baseProfile);
    expect(graph).toHaveLength(1);
    expect(graph[0]).toEqual(buildBusinessJsonLd(baseProfile));
  });

  it('does NOT re-emit the server-side WebSite / WebPage / BreadcrumbList (no duplicate entities)', () => {
    const types = buildSiteJsonLd(baseProfile).map((n) => n['@type']);
    expect(types).not.toContain('WebSite');
    expect(types).not.toContain('WebPage');
    expect(types).not.toContain('BreadcrumbList');
    expect(types[0]).toBe('SoftwareApplication'); // saas → the business entity type
  });

  it('carries no client-side SearchAction (that lives on the server-injected WebSite)', () => {
    const graph = buildSiteJsonLd(baseProfile);
    expect(graph[0].potentialAction).toBeUndefined();
  });
});

describe('describeToday', () => {
  it('says open with the closing time when currently open', () => {
    expect(describeToday('Mon–Fri 9am–5pm', 'Monday', 10 * 60)).toEqual({ open: true, label: 'Open now · until 5pm' });
  });
  it('says when it opens later today', () => {
    expect(describeToday('Mon–Fri 9am–5pm', 'Monday', 8 * 60)).toEqual({ open: false, label: 'Opens today at 9am' });
  });
  it('says closed now after closing time', () => {
    expect(describeToday('Mon–Fri 9am–5pm', 'Monday', 18 * 60)).toEqual({ open: false, label: 'Closed now' });
  });
  it('says closed today on a closed day', () => {
    expect(describeToday('Mon–Fri 9am–5pm', 'Sunday', 10 * 60)).toEqual({ open: false, label: 'Closed today' });
  });
  it('returns null for unparseable hours (chip hidden)', () => {
    expect(describeToday('By appointment only', 'Monday', 600)).toBeNull();
  });
});

describe('end-to-end org node (the live Home.tsx path)', () => {
  it('a local-service profile with real hours+address emits HomeAndConstructionBusiness + openingHoursSpecification + address', () => {
    const [org] = buildSiteJsonLd({
      name: 'Anchor Plumbing',
      description: 'Licensed plumber, same-day service.',
      url: 'https://anchorplumbing.example',
      businessClass: 'local-service',
      address: parseAddress('5678 C Street, Anchorage, AK 99503'),
      openingHours: parseHours('Mon–Sat 8am–6pm · 24/7 emergency'),
    });
    expect(org['@type']).toBe('HomeAndConstructionBusiness');
    expect((org.address as Record<string, unknown>)['@type']).toBe('PostalAddress');
    const hours = org.openingHoursSpecification as Array<Record<string, unknown>>;
    expect(hours).toHaveLength(1); // "24/7 emergency" clause skipped
    expect(hours[0]).toEqual({ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '08:00', closes: '18:00' });
  });
});

describe('isLocalBusinessClass', () => {
  it.each([
    ['storefront',   true],
    ['restaurant',   true],
    ['medical',      true],
    ['dental',       true],
    ['wellness',     true],
    ['retail',       true],
    ['salon',        true],
    ['gym',          true],
    ['fitness',      true],
    ['auto-repair',  true],
    ['local-service', true],
    ['real-estate',  true],
    // legal + nonprofit have a findable office → local (get address/geo/openingHours),
    // matching how Google surfaces law firms + food banks in the local pack.
    ['nonprofit',    true],
    ['legal',        true],
    ['saas',         false],
    ['portfolio',    false],
    ['organization', false],
  ] as const)('%s → %s', (cls, expected) => {
    expect(isLocalBusinessClass(cls)).toBe(expected);
  });
});
