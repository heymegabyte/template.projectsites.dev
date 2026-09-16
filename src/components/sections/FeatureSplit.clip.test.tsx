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

describe('clipRevealEnabled — VITE_CLIP_REVEAL gate (dark by default)', () => {
  it('is OFF unless VITE_CLIP_REVEAL=1 (experimental, promote-to-enable)', () => {
    expect(clipRevealEnabled()).toBe(false);
    vi.stubEnv('VITE_CLIP_REVEAL', '1');
    expect(clipRevealEnabled()).toBe(true);
    vi.stubEnv('VITE_CLIP_REVEAL', '0');
    expect(clipRevealEnabled()).toBe(false);
  });
});

describe('FeatureSplit — clip-path reveal is flag-gated', () => {
  it('does NOT apply ps-clip-reveal when the flag is off (default), image still renders', () => {
    const { container } = renderFS();
    expect(container.querySelector('[data-clip-reveal="1"]')).toBeNull();
    expect(container.querySelector('.ps-clip-reveal')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull(); // feature dark ≠ image gone
  });

  it('applies ps-clip-reveal to the framed image container when the flag is ON (reveal wraps, never replaces)', () => {
    vi.stubEnv('VITE_CLIP_REVEAL', '1');
    const { container } = renderFS();
    const el = container.querySelector('[data-clip-reveal="1"]') as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el!.classList.contains('ps-clip-reveal')).toBe(true);
    expect(el!.querySelector('img')).not.toBeNull(); // the framed <img> is still inside
  });
});
