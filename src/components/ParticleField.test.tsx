import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ParticleField } from './ParticleField';
import { particleFieldEnabled } from '@/lib/featureFlags';

/**
 * Ambient particle field (`particle_field` / VITE_PARTICLE_FIELD). Locks the STRUCTURAL contract
 * jsdom can assert — the flag gate + the reduced-motion gate + the LCP-safe post-idle mount (the
 * canvas is absent on first render, appears only after an idle callback). The actual drifting-mote
 * animation + LCP-safety are proven in a real browser by e2e/verify-particle-field.mjs.
 */
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Stub matchMedia so `(prefers-reduced-motion: no-preference)` resolves to `motionOk`. */
function stubMatchMedia(motionOk: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('no-preference') ? motionOk : !motionOk,
    media: q,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }));
  // Force the setTimeout fallback path so fake timers can drive the post-idle mount.
  vi.stubGlobal('requestIdleCallback', undefined);
}

describe('particleFieldEnabled — VITE_PARTICLE_FIELD gate (ON by default, opt-OUT — AL-801)', () => {
  it('is ON by default (no env) and only OFF when explicitly VITE_PARTICLE_FIELD=0', () => {
    expect(particleFieldEnabled()).toBe(true); // promoted default-on (safe by construction)
    vi.stubEnv('VITE_PARTICLE_FIELD', '0');
    expect(particleFieldEnabled()).toBe(false); // the escape hatch
    vi.stubEnv('VITE_PARTICLE_FIELD', '1');
    expect(particleFieldEnabled()).toBe(true);
  });
});

describe('ParticleField', () => {
  it('renders NOTHING when opted OUT (VITE_PARTICLE_FIELD=0) — the escape hatch', () => {
    vi.stubEnv('VITE_PARTICLE_FIELD', '0');
    stubMatchMedia(true);
    const { container } = render(<ParticleField />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('renders NOTHING under prefers-reduced-motion even with the flag ON', () => {
    vi.stubEnv('VITE_PARTICLE_FIELD', '1');
    stubMatchMedia(false); // reduce
    const { container } = render(<ParticleField />);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('is LCP-safe: with the flag ON + motion OK, the canvas is ABSENT on first paint and mounts only AFTER an idle callback', () => {
    vi.useFakeTimers();
    vi.stubEnv('VITE_PARTICLE_FIELD', '1');
    stubMatchMedia(true);
    const { container } = render(<ParticleField />);
    // First paint: NO canvas competing with the LCP element.
    expect(container.querySelector('canvas')).toBeNull();
    // Post-idle (the setTimeout(200) fallback): the decorative canvas mounts.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('aria-hidden')).toBe('true');
    expect(canvas?.classList.contains('ps-particle-field')).toBe(true);
    expect(canvas?.getAttribute('data-particle-field')).toBe('1');
  });
});
