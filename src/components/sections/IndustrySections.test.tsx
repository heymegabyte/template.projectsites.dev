import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { Menu } from './Menu';
import { ServiceMenu } from './ServiceMenu';
import { DonationTiers } from './DonationTiers';
import { FeaturedCollection } from './FeaturedCollection';

/**
 * Industry-specific sections (AL-620) — each must: (1) render `null` when every
 * data leaf is an unresolved generation token (the scrubText firewall), so a
 * partial build never ships raw `{TOKEN}` markup; and (2) emit exactly the right
 * JSON-LD @type when real data is present, so the structured-data gate + rich
 * results index the actual menu / hours / services / catalog. jsdom has no layout,
 * so we assert on DOM presence + parsed JSON-LD, never on visual geometry.
 */
function ldTypes(container: HTMLElement): string[] {
  return [...container.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => {
      try {
        return (JSON.parse(s.textContent || '{}') as { '@type'?: string })['@type'] ?? '';
      } catch {
        return '';
      }
    })
    .filter(Boolean);
}
const renderSec = (el: ReactElement) => render(el).container;

describe('Menu', () => {
  it('renders items + Menu JSON-LD when real', () => {
    const c = renderSec(
      <Menu
        headline="Our Menu"
        categories={[
          { name: 'Pizza', items: [{ name: 'Margherita', price: '$14', tags: ['V'] }, { name: 'Diavola', price: '$16' }] },
        ]}
      />,
    );
    expect(c.textContent).toContain('Margherita');
    expect(c.textContent).toContain('$14');
    expect(ldTypes(c)).toContain('Menu');
  });
  it('renders null when all tokens unresolved', () => {
    const c = renderSec(<Menu categories={[{ name: '{CAT}', items: [{ name: '{ITEM_1}', price: '{PRICE}' }] }]} />);
    expect(c.querySelector('section')).toBeNull();
  });
});

describe('ServiceMenu', () => {
  it('renders services + OfferCatalog JSON-LD when real', () => {
    const c = renderSec(
      <ServiceMenu
        bookUrl="https://cal.com/x"
        categories={[{ name: 'Hair', services: [{ name: 'Cut', price: '$45', duration: '45 min' }] }]}
      />,
    );
    expect(c.textContent).toContain('Cut');
    expect(c.querySelector('[data-bcl="book"]')).not.toBeNull();
    expect(ldTypes(c)).toContain('OfferCatalog');
  });
  it('renders null when all tokens unresolved', () => {
    const c = renderSec(<ServiceMenu categories={[{ name: '{CAT}', services: [{ name: '{SVC}' }] }]} />);
    expect(c.querySelector('section')).toBeNull();
  });
});

describe('DonationTiers', () => {
  it('renders tiers + NGO JSON-LD + tracked donate CTA when a link is present', () => {
    const c = renderSec(
      <DonationTiers
        donateUrl="https://donate.example.org/give"
        tiers={[{ amount: '$25', impact: '$25 = 12 meals' }]}
      />,
    );
    expect(c.textContent).toContain('$25');
    expect(c.querySelectorAll('[data-bcl="donate"]').length).toBeGreaterThan(0);
    expect(ldTypes(c)).toContain('NGO');
  });
  it('renders null when there is no donate link and no phone', () => {
    const c = renderSec(<DonationTiers donateUrl="{DONATE_URL}" tiers={[{ amount: '{AMT}' }]} />);
    expect(c.querySelector('section')).toBeNull();
  });
});

describe('FeaturedCollection', () => {
  it('renders products + ItemList JSON-LD when real', () => {
    const c = renderSec(
      <FeaturedCollection
        headline="New Arrivals"
        items={[{ name: 'Gold Ring', price: '$480', badge: 'New', href: 'https://x/p/1' }]}
      />,
    );
    expect(c.textContent).toContain('Gold Ring');
    expect(c.querySelector('[data-bcl="product-view"]')).not.toBeNull();
    expect(ldTypes(c)).toContain('ItemList');
  });
  it('product image is decorative (alt="") + async-decoded — the adjacent name carries the meaning (no double-announce)', () => {
    const c = renderSec(
      <FeaturedCollection items={[{ name: 'Gold Ring', image: 'https://img.example/x.jpg', href: 'https://x/p/1' }]} />,
    );
    const img = c.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('');
    expect(img?.getAttribute('decoding')).toBe('async');
  });
  it('renders null when all tokens unresolved', () => {
    const c = renderSec(<FeaturedCollection items={[{ name: '{ITEM}', price: '{PRICE}' }]} />);
    expect(c.querySelector('section')).toBeNull();
  });
});
