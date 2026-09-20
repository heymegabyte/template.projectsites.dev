import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { KineticMarquee } from './KineticMarquee';
import { kineticMarqueeEnabled } from '@/lib/featureFlags';

/**
 * Kinetic velocity marquee (`kinetic_marquee` / VITE_KINETIC_MARQUEE). Locks the flag gate + the
 * content-safety contract jsdom can assert: DARK by default; drops unfilled `{TOKEN}` placeholders;
 * renders NOTHING (never a broken/empty band) when <2 real words survive; ambient decoration
 * (`aria-hidden`) with a seamless doubled sequence. The compositor drift + `animation-timeline:
 * scroll(root)` keyframes themselves are proven in a real browser by verify-kinetic-marquee.mjs.
 */
afterEach(() => vi.unstubAllEnvs());

describe('kineticMarqueeEnabled — VITE_KINETIC_MARQUEE gate (ON by default, opt-OUT — AL-832)', () => {
  it('is ON by default (no env) and only OFF when explicitly VITE_KINETIC_MARQUEE=0', () => {
    expect(kineticMarqueeEnabled()).toBe(true); // promoted default-on (safe by construction)
    vi.stubEnv('VITE_KINETIC_MARQUEE', '0');
    expect(kineticMarqueeEnabled()).toBe(false); // the opt-out escape hatch
    vi.stubEnv('VITE_KINETIC_MARQUEE', '1');
    expect(kineticMarqueeEnabled()).toBe(true);
  });
});

describe('KineticMarquee', () => {
  const WORDS = ['Espresso', 'Pastries', 'Roastery', 'Catering'];

  it('renders an aria-hidden decorative band with a doubled seamless sequence + data hook', () => {
    const { container } = render(<KineticMarquee words={WORDS} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('data-kinetic-marquee')).toBe('1');
    expect(root.classList.contains('ps-kinetic-marquee')).toBe(true);
    expect(root.querySelector('.ps-kinetic-marquee__track')).not.toBeNull();
    // Sequence held TWICE so the -50% drift keyframe loops seamlessly.
    const wordEls = root.querySelectorAll('.ps-kinetic-marquee__word');
    expect(wordEls.length).toBe(WORDS.length * 2);
    expect(root.textContent).toContain('Espresso');
    expect(root.textContent).toContain('Catering');
  });

  it('drops unfilled {TOKEN} placeholders and empties (only real offerings ride the ribbon)', () => {
    const { container } = render(
      <KineticMarquee words={['Espresso', '{FEATURE_2_TITLE}', '  ', 'Pastries']} />,
    );
    const root = container.firstElementChild as HTMLElement;
    // Two real words survive → doubled = 4 word spans; the placeholder + blank are gone.
    expect(root.querySelectorAll('.ps-kinetic-marquee__word').length).toBe(4);
    expect(root.textContent).not.toContain('{FEATURE_2_TITLE}');
  });

  it('renders NOTHING when fewer than two real words survive (never a broken/empty band)', () => {
    const allTokens = render(<KineticMarquee words={['{A}', '{B}', '']} />);
    expect(allTokens.container.firstElementChild).toBeNull();
    const single = render(<KineticMarquee words={['Espresso', '{B}']} />);
    expect(single.container.firstElementChild).toBeNull();
  });
});
