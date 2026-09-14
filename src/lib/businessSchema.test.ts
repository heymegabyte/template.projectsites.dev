import { describe, it, expect } from 'vitest';
import { buildSiteJsonLd, buildBusinessJsonLd, type BusinessProfile } from './businessSchema';

/**
 * AL-522 — the client-side JSON-LD dedup. The site-level WebSite / WebPage /
 * BreadcrumbList are injected SERVER-SIDE (worker build_validators shell injector);
 * buildSiteJsonLd must emit ONLY the rich business entity so the rendered DOM has no
 * duplicate WebSite / WebPage / BreadcrumbList (Google can't merge them — the server
 * blocks carry no @id, the old client copies did).
 */
const GYM: BusinessProfile = {
  name: 'Vanta Strength Club',
  description: 'A strength gym in Austin.',
  url: 'https://vanta-strength-austin.projectsites.dev',
  businessClass: 'gym',
  phone: '(512) 555-0100',
  address: {
    streetAddress: '100 Congress Ave',
    addressLocality: 'Austin',
    addressRegion: 'TX',
    postalCode: '78701',
    addressCountry: 'US',
  },
  geo: { latitude: 30.26, longitude: -97.74 },
};

describe('buildSiteJsonLd (AL-522: client emits only the rich business entity, no server-owned dups)', () => {
  it('returns EXACTLY ONE node — the business entity', () => {
    const nodes = buildSiteJsonLd(GYM);
    expect(nodes).toHaveLength(1);
  });

  it('NEVER re-emits the server-owned site-level types (WebSite / WebPage / BreadcrumbList / WebSite dup)', () => {
    const types = buildSiteJsonLd(GYM).map((n) => n['@type']);
    for (const owned of ['WebSite', 'WebPage', 'BreadcrumbList']) {
      expect(types).not.toContain(owned); // the server injects these — re-emitting duplicated them
    }
  });

  it('emits the RICH LocalBusiness subtype the server lacks (ExerciseGym for a gym, with NAP + geo)', () => {
    const [org] = buildSiteJsonLd(GYM);
    expect(org['@type']).toBe('ExerciseGym'); // the specific subtype, not a generic Organization
    expect(org['@id']).toBe(`${GYM.url}#org`);
    expect((org.address as Record<string, unknown>)?.['@type']).toBe('PostalAddress');
    expect((org.geo as Record<string, unknown>)?.['@type']).toBe('GeoCoordinates');
    expect(org.telephone).toBe(GYM.phone);
  });

  it('is the same single rich entity buildBusinessJsonLd builds (no divergence)', () => {
    expect(buildSiteJsonLd(GYM)).toEqual([buildBusinessJsonLd(GYM)]);
  });

  it('has no duplicate @type within the returned graph (trivially true at length 1, guards future adds)', () => {
    const types = buildSiteJsonLd(GYM).map((n) => n['@type']);
    expect(new Set(types).size).toBe(types.length);
  });

  it('a non-local class (saas) still yields exactly one entity, no site-level dups', () => {
    const saas = buildSiteJsonLd({ ...GYM, businessClass: 'saas', address: undefined, geo: undefined });
    expect(saas).toHaveLength(1);
    expect(saas[0]['@type']).toBe('SoftwareApplication');
  });
});
