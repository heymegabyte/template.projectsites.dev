import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { FeatureSplit } from './FeatureSplit';
import { clipRevealEnabled } from '@/lib/featureFlags';

/**
 * BLEEDING-EDGE clip-path scroll reveal (`clip_reveal` / VITE_CLIP_REVEAL). Locks the flag gate +
 * the wiring: the effect is DARK by default (never on a shipped site until promoted), and when
 * promoted it decorates the framed image WITHOUT removing it (reveal wraps, never replaces). The
 * animated `clip-path` itself is a compositor `animation-timeline: view()` rule jsdom can't run —
 * that's proven in a real browser by verify-clip-reveal.mjs; here we lock the STRUCTURAL contract.
 */
const renderFS = () =>
  render(
    <MemoryRouter>
      <FeatureSplit
        headline="A real, specific headline"
        description="A real description that isn't a placeholder token."
        image={{ src: 'https://images.example.com/about.jpg', alt: 'About the business' }}
      />
    </MemoryRouter>,
  );

afterEach(() => vi.unstubAllEnvs());

describe('clipRevealEnabled — VITE_CLIP_REVEAL gate (ON by default, opt-OUT — AL-833)', () => {
  it('is ON by default (no env) and only OFF when explicitly VITE_CLIP_REVEAL=0', () => {
    expect(clipRevealEnabled()).toBe(true); // promoted default-on (safe by construction)
    vi.stubEnv('VITE_CLIP_REVEAL', '0');
    expect(clipRevealEnabled()).toBe(false); // the opt-out escape hatch
    vi.stubEnv('VITE_CLIP_REVEAL', '1');
    expect(clipRevealEnabled()).toBe(true);
  });
});

describe('FeatureSplit — clip-path reveal is flag-gated', () => {
  it('applies ps-clip-reveal to the framed image container by DEFAULT (ON) — reveal wraps, never replaces', () => {
    const { container } = renderFS();
    const el = container.querySelector('[data-clip-reveal="1"]') as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el!.classList.contains('ps-clip-reveal')).toBe(true);
    expect(el!.querySelector('img')).not.toBeNull(); // the framed <img> is still inside
  });

  it('does NOT apply ps-clip-reveal when opted OUT (VITE_CLIP_REVEAL=0), image still renders', () => {
    vi.stubEnv('VITE_CLIP_REVEAL', '0');
    const { container } = renderFS();
    expect(container.querySelector('[data-clip-reveal="1"]')).toBeNull();
    expect(container.querySelector('.ps-clip-reveal')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull(); // opted-out ≠ image gone
  });
});

describe('FeatureSplit — Ken-Burns living-imagery wrapper (CINEMATIC-3D, ships ON)', () => {
  it('wraps the framed image in a .ps-ken-burns scroll-scale layer, and the img keeps its hover-scale', () => {
    const { container } = renderFS();
    const kb = container.querySelector('.ps-ken-burns') as HTMLElement | null;
    expect(kb).not.toBeNull();
    const img = kb!.querySelector('img'); // Ken-Burns WRAPS the img (composes with hover, never replaces)
    expect(img).not.toBeNull();
    expect(img!.className).toContain('group-hover:scale-[1.06]'); // hover micro-interaction preserved
  });
});
