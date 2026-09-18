import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { FAQ } from './FAQ';
import { Pricing } from './Pricing';
import { BlogList } from './BlogList';
import { BentoGrid, type BentoTile } from './BentoGrid';

/**
 * Regression for the delivered-site defect surfed 2026-08-27: section-only pages
 * (FAQ / Pricing / Blog) rendered with ZERO <h1> in the hydrated DOM — every
 * section headline is an <h2>, and these pages have no explicit hero, so a real
 * visitor + screen reader + JS-crawler saw no page h1 (SEO + WCAG heading-order
 * defect the shell-only build validator missed). Fix: each lead section takes an
 * `as="h1"` prop so the page has exactly one h1. This guards the mechanism: the
 * lead headline promotes to <h1>, and the default stays <h2> for downstream sections.
 */

const faqItems = [{ question: 'How fast is it?', answer: 'Your site is live in under 15 minutes, start to finish.' }];
const tiers = [
  { id: 'starter', name: 'Starter', description: 'For getting going', monthly: 49, yearly: 470, features: ['One site', 'SSL included'] },
];
const posts = [{ slug: 'first', title: 'A first post', excerpt: 'A real, specific excerpt.', date: '2026-01-01' }];

const renderIn = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('section-only page headings — lead section promotes to <h1> (exactly one per page)', () => {
  it('FAQ: as="h1" renders the headline as the sole <h1>; default is <h2>', () => {
    const { container, unmount } = renderIn(<FAQ items={faqItems} headline="Frequently asked questions" as="h1" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toContain('Frequently asked questions');
    unmount();

    const { container: c2 } = renderIn(<FAQ items={faqItems} headline="Frequently asked questions" />);
    expect(c2.querySelectorAll('h1')).toHaveLength(0);
    expect(c2.querySelector('h2')?.textContent).toContain('Frequently asked questions');
  });

  it('Pricing: as="h1" renders the headline as the sole <h1>', () => {
    const { container } = renderIn(<Pricing tiers={tiers} headline="Simple, transparent pricing" as="h1" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toContain('Simple, transparent pricing');
  });

  it('BlogList: as="h1" renders the headline as the sole <h1>', () => {
    const { container } = renderIn(<BlogList posts={posts} headline="Notes from the field" as="h1" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toContain('Notes from the field');
  });
});

/**
 * Regression for the fleet-wide heading-order defect surfed 2026-09-18: the
 * first-after-hero BentoGrid highlights section is rendered by the generator WITHOUT
 * a `headline` (common), so no section <h2> exists — yet its tile titles were always
 * <h3>, producing a page skip H1 → H3 (WCAG 1.3.1 / axe heading-order) on every
 * deployed site (franklin-barbecue, pizzeria-bianco-phoenix, vanta-strength-austin …).
 * Fix: tile titles are <h3> only when a section <h2> headline renders; otherwise they
 * are <h2> so the hierarchy never skips a level.
 */
describe('BentoGrid tile heading level adapts to the section headline (no H1→H3 skip)', () => {
  const tiles: BentoTile[] = [
    { id: 'a', title: 'Made from scratch', description: 'Real, specific benefit copy here.' },
    { id: 'b', title: 'Local ingredients', description: 'Real, specific benefit copy here.' },
  ];

  it('WITHOUT a headline: no <h2> section title exists, so tiles are <h2> (not <h3>)', () => {
    const { container } = renderIn(<BentoGrid tiles={tiles} />);
    // No section headline → no lone <h2> heading above <h3> cards.
    expect(container.querySelectorAll('h3')).toHaveLength(0);
    const h2s = [...container.querySelectorAll('h2')].map((h) => h.textContent);
    expect(h2s).toContain('Made from scratch');
    expect(h2s).toContain('Local ingredients');
  });

  it('WITH a headline: the headline is the <h2> and tiles are <h3> (correct subordination)', () => {
    const { container } = renderIn(<BentoGrid tiles={tiles} headline="Why choose us" />);
    expect(container.querySelector('h2')?.textContent).toContain('Why choose us');
    const h3s = [...container.querySelectorAll('h3')].map((h) => h.textContent);
    expect(h3s).toContain('Made from scratch');
    expect(h3s).toContain('Local ingredients');
  });

  it('an eyebrow alone (a decorative <span>, not a heading) still leaves tiles as <h2>', () => {
    const { container } = renderIn(<BentoGrid tiles={tiles} eyebrow="WHAT WE OFFER" />);
    // Eyebrow is a <span> — it does not create a heading level, so tiles stay <h2>.
    expect(container.querySelectorAll('h3')).toHaveLength(0);
    expect([...container.querySelectorAll('h2')].map((h) => h.textContent)).toContain('Made from scratch');
  });
});
