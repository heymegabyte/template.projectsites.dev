import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ProcessSteps } from './ProcessSteps';
import { scrollStackEnabled } from '@/lib/featureFlags';

/**
 * Scroll-stacking cards (`scroll_stack` / VITE_SCROLL_STACK). Locks the flag gate + the `stack`
 * variant's STRUCTURAL contract jsdom can assert: DARK by default; `stack` flips the `<ol>` from the
 * horizontal grid to the vertical `.ps-scroll-stack` deck and drops the horizontal connector rail;
 * default renders byte-for-byte the existing grid. The sticky pin + view()-scrubbed recede are
 * CSS-only and proven in a real browser by e2e/site-quality/verify-scroll-stack.mjs. Mirrors
 * CinematicProcess.test.tsx / DepthCascade.test.tsx.
 */
afterEach(() => vi.unstubAllEnvs());

const steps = [
  { title: 'Search your business', description: 'Find your listing in seconds.' },
  { title: 'We build it', description: 'AI assembles a gorgeous site.' },
  { title: 'You go live', description: 'Hosted, SSL, live in minutes.' },
];

describe('scrollStackEnabled — VITE_SCROLL_STACK gate (dark by default)', () => {
  it('is OFF by default (experimental) and ON only when VITE_SCROLL_STACK=1', () => {
    expect(scrollStackEnabled()).toBe(false);
    vi.stubEnv('VITE_SCROLL_STACK', '1');
    expect(scrollStackEnabled()).toBe(true);
  });
});

describe('ProcessSteps — stack (deck) vs grid variant', () => {
  it('default is the horizontal GRID — no scroll-stack class, connector rail present', () => {
    const { container } = render(<ProcessSteps steps={steps} headline="How we do it" />);
    const ol = container.querySelector('ol.process-steps') as HTMLElement;
    expect(ol).toBeTruthy();
    expect(ol.classList.contains('ps-scroll-stack')).toBe(false);
    expect(ol.classList.contains('grid')).toBe(true);
    // the horizontal flow connector belongs to the grid layout
    expect(container.querySelector('.process-connector')).not.toBeNull();
    // content intact
    expect(ol.querySelectorAll('li.process-step').length).toBe(3);
    expect(ol.textContent).toContain('We build it');
  });

  it('stack flips to the VERTICAL deck — .ps-scroll-stack, no grid, connector rail dropped', () => {
    const { container } = render(<ProcessSteps steps={steps} headline="How we do it" stack />);
    const ol = container.querySelector('ol.process-steps') as HTMLElement;
    expect(ol.classList.contains('ps-scroll-stack')).toBe(true);
    expect(ol.classList.contains('grid')).toBe(false);
    // the horizontal rail is meaningless in a vertical deck → not rendered
    expect(container.querySelector('.process-connector')).toBeNull();
    // same steps, still keyed on --step-i for the deck offset, content unchanged
    const items = ol.querySelectorAll('li.process-step');
    expect(items.length).toBe(3);
    expect((items[1] as HTMLElement).style.getPropertyValue('--step-i')).toBe('1');
    expect(ol.textContent).toContain('You go live');
  });
});
