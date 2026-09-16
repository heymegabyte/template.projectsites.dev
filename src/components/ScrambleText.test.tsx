import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ScrambleText } from './ScrambleText';
import { textScrambleEnabled } from '@/lib/featureFlags';

/**
 * Kinetic text-scramble (`text_scramble` / VITE_TEXT_SCRAMBLE). Locks the flag gate + the a11y
 * contract: DARK by default (a shipped site is never scrambled until promoted), and when promoted
 * the REAL text stays in the accessible tree (an `.sr-only` node) so screen readers + crawlers
 * always get the real label — the animated glyphs are a SEPARATE `aria-hidden` visual layer. The
 * rAF decode itself is a compositor-time behaviour jsdom can't run; verify-text-scramble.mjs proves
 * it live. Here we lock the STRUCTURAL + a11y contract.
 */
afterEach(() => vi.unstubAllEnvs());

describe('textScrambleEnabled — VITE_TEXT_SCRAMBLE gate (dark by default)', () => {
  it('is OFF unless VITE_TEXT_SCRAMBLE=1 (experimental, promote-to-enable)', () => {
    expect(textScrambleEnabled()).toBe(false);
    vi.stubEnv('VITE_TEXT_SCRAMBLE', '1');
    expect(textScrambleEnabled()).toBe(true);
    vi.stubEnv('VITE_TEXT_SCRAMBLE', '0');
    expect(textScrambleEnabled()).toBe(false);
  });
});

describe('ScrambleText — flag-gated, a11y-safe', () => {
  it('flag OFF (default): renders the plain real text, no scramble wrappers', () => {
    const { container } = render(<ScrambleText text="YOUR NEIGHBORHOOD GROCERY STORE" />);
    expect(container.textContent).toBe('YOUR NEIGHBORHOOD GROCERY STORE');
    expect(container.querySelector('.sr-only')).toBeNull(); // no split — just plain text
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('flag ON: the REAL text is in the accessible tree (.sr-only) + the visual layer is aria-hidden', () => {
    vi.stubEnv('VITE_TEXT_SCRAMBLE', '1');
    const { container } = render(<ScrambleText text="DECODE ME" />);
    const sr = container.querySelector('.sr-only');
    expect(sr).not.toBeNull();
    expect(sr!.textContent).toBe('DECODE ME'); // screen readers + crawlers get the real text
    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual).not.toBeNull();
    // at initial render the visual layer starts on the real text (settles there too — never blank)
    expect((visual!.textContent || '').length).toBe('DECODE ME'.length); // CLS-safe: exact char count preserved
  });
});
