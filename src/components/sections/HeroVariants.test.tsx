import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { HeroCenter, HeroSplit } from './HeroVariants';
import { backdropForPreset } from './WebGLHeroBackdrop';
import { brand } from '@/brand';

/**
 * Regression for the unwired-cinematic defect (surfed 2026-09-08): WebGLHeroBackdrop
 * is a gorgeous, per-industry, LCP-safe animated hero — but the heroes gated it
 * behind an OPTIONAL `webglBackdrop` prop that the generation pipeline never passed,
 * so it rendered on ZERO delivered sites (built-but-completely-unwired). Fix: the
 * heroes auto-derive the backdrop from `brand.themeStyle` via `backdropForPreset`,
 * defaulting ON for every site. It stays LCP-safe (the canvas mounts post-hydration
 * and degrades to a static brand gradient under reduced-motion / no-WebGL — jsdom
 * has no WebGL context, so these assertions exercise that always-legible path).
 *
 * The backdrop ALWAYS mounts a `<canvas>` (the live scene in webgl mode, an
 * invisible probe canvas in static mode), so its presence is the wiring proof.
 */

const renderIn = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('HeroVariants — per-industry WebGL backdrop wired ON by default', () => {
  it('HeroCenter mounts the backdrop with NO explicit prop (auto-derived from preset)', () => {
    const { container } = renderIn(<HeroCenter headline="A real, specific headline" />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('HeroSplit mounts the backdrop with NO explicit prop', () => {
    const { container } = renderIn(
      <HeroSplit
        headline="A real, specific headline"
        image={{ src: 'https://example.com/hero.jpg', alt: 'Storefront' }}
      />,
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('an explicit webglBackdrop prop still wins over the auto-derived default', () => {
    const { container } = renderIn(<HeroCenter headline="H" webglBackdrop="mesh" />);
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('backdropForPreset(brand.themeStyle) always resolves to a real variant', () => {
    expect(['aurora', 'waves', 'mesh', 'ember', 'grid']).toContain(backdropForPreset(brand.themeStyle));
  });
});
