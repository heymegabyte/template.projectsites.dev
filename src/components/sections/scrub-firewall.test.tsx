import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MetricRow } from './MetricRow';
import { Quote } from './Quote';
import { Spotlight } from './Spotlight';
import { Timeline } from './Timeline';
import { LogoCloud } from './LogoCloud';

/**
 * FIRE-55: MetricRow / Quote / Spotlight lacked the scrubText placeholder
 * firewall every sibling section applies (and Timeline skipped `year`), so a
 * partially-run generation could ship literal `{TOKEN}` strings to the DOM —
 * and, for Quote, into its Quotation JSON-LD (structured data must never carry
 * tokens). Locks the firewall on all four, plus the a11y-correct LogoCloud
 * marquee (one real strip, one aria-hidden inert clone — no duplicated tab
 * stops, no focusable-inside-aria-hidden).
 */

const ld = (el: HTMLElement): string =>
  el.querySelector('script[type="application/ld+json"]')?.textContent ?? '';

describe('MetricRow — scrubText firewall', () => {
  it('scrubs token eyebrow/caption/delta and drops the unfilled {METRIC_2_*} slot card', () => {
    const { container } = render(
      <MetricRow
        eyebrow="{METRICS_EYEBROW}"
        headline="Results"
        metrics={[
          {
            value: 34,
            suffix: '%',
            label: 'Conversion uplift',
            caption: '{METRIC_1_CAPTION}',
            delta: { value: '{METRIC_1_DELTA}', direction: 'up' },
          },
          { value: 0, label: '{METRIC_2_LABEL}', caption: '{METRIC_2_CAPTION}' },
        ]}
      />,
    );
    expect(container.textContent).toContain('Conversion uplift');
    expect(container.textContent).not.toMatch(/\{METRIC/);
    expect(container.textContent).not.toContain('{METRICS_EYEBROW}');
    expect(container.querySelectorAll('dl > div').length).toBe(1);
  });

  it('self-hides when every metric is an unfilled slot', () => {
    const { container } = render(
      <MetricRow metrics={[{ value: 0, label: '{METRIC_1_LABEL}' }]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('Quote — scrubText firewall incl. Quotation JSON-LD', () => {
  it('token role/source/photo never render — and never reach the JSON-LD', () => {
    const { container } = render(
      <Quote
        text="The rebuild paid for itself in a quarter."
        author="Dana Ortiz"
        role="{QUOTE_ROLE}"
        photo="{QUOTE_PHOTO}"
        source={{ name: '{QUOTE_SOURCE}', href: '{QUOTE_SOURCE_URL}' }}
        eyebrow="{QUOTE_EYEBROW}"
      />,
    );
    expect(container.textContent).toContain('Dana Ortiz');
    expect(container.textContent).not.toMatch(/\{QUOTE/);
    expect(container.querySelector('img')).toBeNull(); // token photo → no 404 <img>
    const json = ld(container);
    expect(json).toContain('The rebuild paid for itself');
    expect(json).toContain('Dana Ortiz');
    expect(json).not.toMatch(/\{QUOTE/); // tokens must never enter structured data
  });

  it('a token quote text self-hides the whole section — no DOM, no JSON-LD node', () => {
    const { container } = render(<Quote text="{QUOTE_TEXT}" author="{QUOTE_AUTHOR}" />);
    expect(container.firstChild).toBeNull();
    expect(ld(container)).toBe('');
  });
});

describe('Spotlight — scrubText firewall', () => {
  it('scrubs token copy, drops token features/CTAs, and never renders a token-src <img>', () => {
    const { container } = render(
      <MemoryRouter>
        <Spotlight
          eyebrow="{SPOT_EYEBROW}"
          headline="One platform for the whole shop"
          description="{SPOT_DESCRIPTION}"
          badge="{SPOT_BADGE}"
          features={['Real feature', '{SPOT_FEATURE_2}']}
          primary={{ label: '{SPOT_CTA}', href: '/contact' }}
          secondary={{ label: 'See pricing', href: '/pricing' }}
          visual={{ src: '{SPOT_IMAGE_URL}', alt: '{SPOT_IMAGE_ALT}' }}
        />
      </MemoryRouter>,
    );
    expect(container.textContent).toContain('One platform for the whole shop');
    expect(container.textContent).toContain('Real feature');
    expect(container.textContent).not.toMatch(/\{SPOT/);
    expect(container.querySelector('img')).toBeNull(); // token visual → no 404 <img>
    expect(container.querySelectorAll('a').length).toBe(1); // token-label CTA dropped
    expect(container.textContent).toContain('See pricing');
  });
});

describe('Timeline — year is scrubbed like every other event field', () => {
  it('a {TIMELINE_1_YEAR} token never reaches the <time> element', () => {
    const { container } = render(
      <Timeline
        events={[
          { year: '{TIMELINE_1_YEAR}', title: 'Founded', description: 'Opened the first shop.' },
          { year: '1987', title: 'Expanded', description: 'Second location.' },
        ]}
      />,
    );
    expect(container.textContent).not.toContain('{TIMELINE_1_YEAR}');
    expect(container.querySelectorAll('time').length).toBe(1);
    expect(container.querySelector('time')?.getAttribute('datetime')).toBe('1987');
    expect(container.textContent).toContain('Founded'); // event itself still renders
  });
});

describe('LogoCloud marquee — one real strip, one aria-hidden inert clone', () => {
  it('duplicate strip links are tabIndex=-1 inside aria-hidden; real strip stays focusable', () => {
    const { container } = render(
      <LogoCloud
        variant="marquee"
        logos={[{ name: 'Acme', href: 'https://acme.example' }]}
      />,
    );
    const tracks = container.querySelectorAll('.marquee__track');
    expect(tracks.length).toBe(2);
    expect(tracks[0].getAttribute('aria-hidden')).toBeNull(); // real strip exposed to AT
    expect(tracks[1].getAttribute('aria-hidden')).toBe('true'); // clone inert (links inherit)
    // Exactly ONE focusable logo link — the clone's is removed from the tab order.
    expect(container.querySelectorAll('a:not([tabindex="-1"])').length).toBe(1);
    expect(tracks[1].querySelector('a')?.getAttribute('tabindex')).toBe('-1');
    // No focusable element anywhere inside an aria-hidden subtree (axe aria-hidden-focus).
    container.querySelectorAll('[aria-hidden="true"] a').forEach((a) => {
      expect(a.getAttribute('tabindex')).toBe('-1');
    });
  });
});
