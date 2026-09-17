import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PointerSpotlight } from './PointerSpotlight';

/**
 * CINEMATIC-3D cursor-follow spotlight contract. The visual follow is a compositor-driven
 * transform jsdom can't run, so these lock the STRUCTURAL + GATING contract: it's decorative,
 * and the pointer-tracking listener attaches ONLY on (pointer:fine) + motion-ok — otherwise the
 * tasteful STATIC glow stands (touch + reduced-motion never get motion). Guards the gate from
 * silently regressing to always-on (an INP/accessibility risk).
 */
const setMatchMedia = (fine: boolean, motionOk: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('pointer: fine') ? fine : q.includes('reduced-motion: no-preference') ? motionOk : false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  })) as unknown as typeof window.matchMedia;
};

afterEach(() => {
  vi.restoreAllMocks();
  // @ts-expect-error reset for the next test's gate
  delete window.matchMedia;
});

describe('PointerSpotlight — cursor-follow ambient glow', () => {
  it('is decorative: aria-hidden + carries the .pointer-spotlight hook', () => {
    setMatchMedia(false, true); // coarse pointer
    const { container } = render(<PointerSpotlight className="test-glow" />);
    const el = container.querySelector('.pointer-spotlight') as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el!.getAttribute('aria-hidden')).toBe('true');
    expect(el!.className).toContain('test-glow'); // caller styling composes through
  });

  it('does NOT track on a coarse pointer (touch) — static glow stands', () => {
    setMatchMedia(false, true);
    const { container } = render(<PointerSpotlight />);
    expect((container.querySelector('.pointer-spotlight') as HTMLElement).dataset.tracking).toBeUndefined();
  });

  it('does NOT track under reduced-motion — static glow stands', () => {
    setMatchMedia(true, false);
    const { container } = render(<PointerSpotlight />);
    expect((container.querySelector('.pointer-spotlight') as HTMLElement).dataset.tracking).toBeUndefined();
  });

  it('DOES track on a fine pointer with motion allowed', () => {
    setMatchMedia(true, true);
    const { container } = render(<PointerSpotlight />);
    expect((container.querySelector('.pointer-spotlight') as HTMLElement).dataset.tracking).toBe('1');
  });
});
