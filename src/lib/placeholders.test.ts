import { describe, it, expect } from 'vitest';
import { cityFromAddress, fitMetaTitle, fitMetaDescription } from './placeholders';

/**
 * Regression for the OSM-city-token leak surfed 2026-09-18 on live sub-pages
 * (swan-oyster-depot `/blog` `/privacy` `/terms` `/faq`): the meta title/description
 * padding derived the city from the naive "second comma field"
 * (`business.address.split(',')[1]`). For a compact Google-Places address that's the
 * city, but for the verbose OSM/Nominatim `display_name` the AL-729 fallback now returns
 * — `"Swan Oyster Depot, 1517, Polk Street, …, San Francisco, California, 94109, United States"`
 * — field [1] is the STREET NUMBER "1517", so every OSM-sourced site shipped
 *   `<title>… · 1517 · get in touch to learn more</title>` and
 *   `<meta>… Proudly serving 1517 and the surrounding area</meta>`.
 * The same class as the worker's AL-733/733b `hero_copy.cityFromAddress` H1 fix; this ports
 * that robust parser to the template so the title/meta derive the SAME city as the H1.
 */
describe('cityFromAddress (Places + OSM robust)', () => {
  it('parses the city from a COMPACT Google-Places address', () => {
    expect(cityFromAddress('1517 Polk St, San Francisco, CA 94109')).toBe('San Francisco');
    expect(cityFromAddress('413 14th Ave SE, Minneapolis, MN 55414')).toBe('Minneapolis');
  });

  it('parses the city from a VERBOSE OSM display_name — never the street number', () => {
    const osm =
      'Swan Oyster Depot, 1517, Polk Street, Nob Hill, San Francisco, California, 94109, United States';
    expect(cityFromAddress(osm)).toBe('San Francisco');
    expect(cityFromAddress(osm)).not.toBe('1517');
  });

  it('drops a spelled-out STATE (OSM) to reveal the city, not "California"/"Texas"', () => {
    expect(cityFromAddress('Franklin Barbecue, 900, East 11th Street, Austin, Texas, 78702, United States')).toBe('Austin');
  });

  it('KEEPS a state-named city in a compact address via the street-peek guard', () => {
    // predecessor of "New York" is the street line → "New York" is the CITY, not the state.
    expect(cityFromAddress('179 E Houston St, New York, NY 10002')).toBe('New York');
  });

  it('returns "" when no confident city (so callers skip the pad, never print junk)', () => {
    expect(cityFromAddress('')).toBe('');
    expect(cityFromAddress(null)).toBe('');
    expect(cityFromAddress('SomewhereOneField')).toBe('');
  });
});

describe('fitMetaTitle / fitMetaDescription never leak a street number as the city', () => {
  const osmBiz = {
    name: 'Swan Oyster Depot',
    tagline: '',
    address:
      'Swan Oyster Depot, 1517, Polk Street, Nob Hill, San Francisco, California, 94109, United States',
  };

  it('title padding uses the real city, not the street number', () => {
    const t = fitMetaTitle('Blog — Swan Oyster Depot', osmBiz);
    expect(t).not.toMatch(/\b1517\b/);
    expect(t).toContain('San Francisco');
    expect(t.length).toBeGreaterThanOrEqual(50);
    expect(t.length).toBeLessThanOrEqual(60);
  });

  it('description padding uses the real city, not the street number', () => {
    const d = fitMetaDescription('Articles and stories from Swan Oyster Depot.', osmBiz);
    expect(d).not.toMatch(/\b1517\b/);
    expect(d).toContain('Proudly serving San Francisco');
    expect(d.length).toBeGreaterThanOrEqual(120);
    expect(d.length).toBeLessThanOrEqual(156);
  });
});
