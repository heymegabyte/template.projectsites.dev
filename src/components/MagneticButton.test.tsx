import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MagneticButton } from './MagneticButton';
import { computeMagnet } from '@/lib/magnet';

/**
 * Magnetic CTA (idea #162, resurrected AL-738). Locks the jsdom-assertable contract — the pure
 * pull math + the structural render (wrapper + decorative halo + children pass-through) + the
 * reduced-motion / coarse-pointer gate leaving a plain, static button. The actual cursor-magnet
 * lean + LCP-safety are proven in a real browser by e2e/site-quality/verify-magnetic-cta.mjs.
 */
afterEach(() => {
  vi.unstubAllGlobals();
});

/** Stub matchMedia: `(pointer: fine)` → finePointer; `reduce` → !motionOk; `no-preference` → motionOk. */
function stubMatchMedia(finePointer: boolean, motionOk: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('pointer: fine') ? finePointer : q.includes('reduce') ? !motionOk : motionOk,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }));
}

describe('computeMagnet — the distance-faded pull vector', () => {
  it('is zero when the cursor is at the button centre', () => {
    expect(computeMagnet(0, 0, 0.35, 90)).toEqual({ x: 0, y: 0 });
  });

  it('is RELEASED (zero) beyond the radius', () => {
    expect(computeMagnet(200, 0, 0.35, 90)).toEqual({ x: 0, y: 0 });
    expect(computeMagnet(0, 91, 0.35, 90)).toEqual({ x: 0, y: 0 });
  });

  it('pulls half-strength at half-radius (proximity fade)', () => {
    // dist 45 of radius 90 → factor 0.5 → 45 * 0.4 * 0.5 = 9
    expect(computeMagnet(45, 0, 0.4, 90)).toEqual({ x: 9, y: 0 });
  });

  it('never divides by a non-positive radius', () => {
    expect(computeMagnet(10, 10, 0.35, 0)).toEqual({ x: 0, y: 0 });
  });
});

describe('MagneticButton — structural contract', () => {
  it('renders the children, a decorative aria-hidden halo, and the magnetic wrapper', () => {
    stubMatchMedia(true, true); // fine pointer, motion OK
    const { container, getByText } = render(
      <MagneticButton>
        <a href="/x">Claim your site</a>
      </MagneticButton>,
    );
    expect(getByText('Claim your site')).toBeTruthy();
    const wrap = container.querySelector('.magnetic-cta');
    expect(wrap).toBeTruthy();
    expect(wrap?.getAttribute('data-magnetic')).not.toBeNull();
    const glow = container.querySelector('.magnetic-glow');
    expect(glow).toBeTruthy();
    expect(glow?.getAttribute('aria-hidden')).toBe('true');
  });

  it('still renders a working plain button under reduced-motion / coarse pointer (enhancement off)', () => {
    stubMatchMedia(false, false); // coarse pointer + reduced motion → gated OFF
    const { getByText, container } = render(
      <MagneticButton>
        <a href="/x">Book now</a>
      </MagneticButton>,
    );
    expect(getByText('Book now')).toBeTruthy();
    // No transform pull is armed (identity at rest — the CSS var stays unset).
    const wrap = container.querySelector('.magnetic-cta') as HTMLElement | null;
    expect(wrap?.style.getPropertyValue('--mag-x')).toBe('');
  });
});
