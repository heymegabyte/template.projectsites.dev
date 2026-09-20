import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SplitHeadline } from './SplitHeadline';

/**
 * Kinetic split-text headline (`word_reveal` / VITE_WORD_REVEAL). Locks the flag gate + the a11y +
 * content contract jsdom can assert: flag-OFF renders a PLAIN heading (byte-identical, no per-word
 * spans); flag-ON splits into `aria-hidden` `.wr-word` spans carrying `--wr-i`, with the INTACT
 * headline on the container `aria-label` (a screen reader reads it once, never the fragments). The
 * scroll-scrubbed reveal itself is a CSS `animation-timeline: view()` rule proven in a real browser
 * by verify-word-reveal.mjs.
 */
afterEach(() => vi.unstubAllEnvs());

describe('SplitHeadline — word_reveal gate (dark by default)', () => {
  it('renders a PLAIN heading (no word-reveal, no spans) when the flag is off (default)', () => {
    const { container } = render(<SplitHeadline as="h2" text="Made from scratch daily" />);
    const h2 = container.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2!.textContent).toBe('Made from scratch daily');
    expect(container.querySelector('.word-reveal')).toBeNull();
    expect(container.querySelectorAll('.wr-word').length).toBe(0);
  });

  it('splits into aria-hidden per-word spans with --wr-i when VITE_WORD_REVEAL=1 (wraps, never replaces the text)', () => {
    vi.stubEnv('VITE_WORD_REVEAL', '1');
    const { container } = render(<SplitHeadline as="h2" text="Made from scratch daily" />);
    const h2 = container.querySelector('h2.word-reveal') as HTMLElement | null;
    expect(h2).not.toBeNull();
    // The intact headline is the accessible name — SR reads it once, not the per-word fragments.
    expect(h2!.getAttribute('aria-label')).toBe('Made from scratch daily');
    const words = container.querySelectorAll('.wr-word');
    expect(words.length).toBe(4); // Made / from / scratch / daily
    words.forEach((w, i) => {
      expect(w.getAttribute('aria-hidden')).toBe('true');
      expect((w as HTMLElement).style.getPropertyValue('--wr-i')).toBe(String(i));
    });
    // Full visible text preserved (the word spans concatenate back to the headline).
    expect(h2!.textContent?.replace(/\s+/g, ' ').trim()).toBe('Made from scratch daily');
  });

  it('renders plain (no split) for a degenerate single-word headline even when ON', () => {
    vi.stubEnv('VITE_WORD_REVEAL', '1');
    const { container } = render(<SplitHeadline as="h2" text="Welcome" />);
    expect(container.querySelector('.word-reveal')).toBeNull();
    expect(container.querySelector('h2')?.textContent).toBe('Welcome');
  });
});
