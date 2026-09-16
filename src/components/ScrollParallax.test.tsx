import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { ScrollParallax } from './ScrollParallax';
import { HeroCenter, HeroSplit } from './sections/HeroVariants';

/**
 * CINEMATIC-3D depth-parallax contract. The visual drift is a compositor-driven
 * `animation-timeline: scroll()` rule (index.css `.ps-parallax`) that jsdom can't run,
 * so these lock the STRUCTURAL contract instead: (a) the wrapper is decorative + carries
 * the `.ps-parallax` hook + its per-layer `--ps-parallax-depth`, and (b) BOTH heroes
 * actually MOUNT parallax layers (guards against the built-but-unwired class that bit
 * WebGLHeroBackdrop — a gorgeous effect gated behind a prop the pipeline never passed).
 */
const renderIn = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ScrollParallax — decorative depth-parallax wrapper', () => {
  it('is decorative (aria-hidden + pointer-events-none) and carries the parallax hook', () => {
    const { container } = render(
      <ScrollParallax depth={1.6} className="test-orb h-64 w-64" />,
    );
    const el = container.querySelector('.ps-parallax') as HTMLElement | null;
    expect(el).not.toBeNull();
    expect(el!.getAttribute('aria-hidden')).toBe('true');
    expect(el!.className).toContain('pointer-events-none');
    expect(el!.className).toContain('test-orb'); // caller styling composes through
  });

  it('sets the per-layer depth as the --ps-parallax-depth custom property', () => {
    const { container } = render(<ScrollParallax depth={0.55} />);
    const el = container.querySelector('.ps-parallax') as HTMLElement;
    expect(el.style.getPropertyValue('--ps-parallax-depth')).toBe('0.55');
  });

  it('defaults depth to 1 when unspecified', () => {
    const { container } = render(<ScrollParallax />);
    const el = container.querySelector('.ps-parallax') as HTMLElement;
    expect(el.style.getPropertyValue('--ps-parallax-depth')).toBe('1');
  });
});

describe('HeroVariants — parallax depth layers are WIRED (not built-but-unwired)', () => {
  it('HeroCenter mounts ≥2 parallax layers, all decorative', () => {
    const { container } = renderIn(<HeroCenter headline="A real, specific headline" />);
    const layers = container.querySelectorAll('.ps-parallax');
    expect(layers.length).toBeGreaterThanOrEqual(2);
    layers.forEach((l) => expect(l.getAttribute('aria-hidden')).toBe('true'));
  });

  it('HeroSplit mounts ≥2 parallax layers at DISTINCT depths (real parallax separation)', () => {
    const { container } = renderIn(<HeroSplit headline="A real, specific headline" />);
    const layers = Array.from(container.querySelectorAll<HTMLElement>('.ps-parallax'));
    expect(layers.length).toBeGreaterThanOrEqual(2);
    const depths = new Set(layers.map((l) => l.style.getPropertyValue('--ps-parallax-depth')));
    expect(depths.size).toBeGreaterThanOrEqual(2); // layers drift at different rates → depth
  });
});
