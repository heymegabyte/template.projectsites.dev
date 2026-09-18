import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { DepthCascade } from './DepthCascade';
import { scrollCinemaEnabled } from '@/lib/featureFlags';

/**
 * Scroll-driven 3D depth-cascade (`scroll_cinema` / VITE_SCROLL_CINEMA). Locks the flag gate + the
 * wiring: DARK by default (a shipped site is byte-for-byte unchanged until promoted), and when
 * promoted it decorates a group WITHOUT altering its DOM/content (adds a class + data hook only).
 * The compositor `animation-timeline: view()` keyframes themselves are proven in a real browser by
 * verify-scroll-cinema.mjs; here we lock the STRUCTURAL contract jsdom can assert.
 */
afterEach(() => vi.unstubAllEnvs());

describe('scrollCinemaEnabled — VITE_SCROLL_CINEMA gate (default-on, killswitch via =0)', () => {
  it('is ON by default (promoted to stable — safe-by-construction like reveal-on-view), OFF only when VITE_SCROLL_CINEMA=0', () => {
    // Promoted (CINEMATIC-3D): the effect is pure native `animation-timeline: view()` with a
    // static-visible fallback — the SAME safety profile as the always-on `.reveal-on-view` — so it
    // ships on by default; VITE_SCROLL_CINEMA=0 is the killswitch.
    expect(scrollCinemaEnabled()).toBe(true);
    vi.stubEnv('VITE_SCROLL_CINEMA', '0');
    expect(scrollCinemaEnabled()).toBe(false);
  });
});

describe('DepthCascade', () => {
  it('is a PLAIN wrapper under the killswitch (VITE_SCROLL_CINEMA=0) — no cascade class, no data hook', () => {
    vi.stubEnv('VITE_SCROLL_CINEMA', '0');
    const { container } = render(
      <DepthCascade className="grid gap-6">
        <div>one</div>
        <div>two</div>
      </DepthCascade>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('ps-depth-cascade')).toBe(false);
    expect(root.getAttribute('data-depth-cascade')).toBeNull();
    // Author classes + children always survive.
    expect(root.classList.contains('grid')).toBe(true);
    expect(root.textContent).toContain('one');
    expect(root.textContent).toContain('two');
  });

  it('adds the cascade class + data hook BY DEFAULT (content DOM unchanged)', () => {
    // No stub — default-on is the promoted behavior.
    const { container } = render(
      <DepthCascade className="grid gap-6">
        <div>one</div>
        <div>two</div>
      </DepthCascade>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains('ps-depth-cascade')).toBe(true);
    expect(root.getAttribute('data-depth-cascade')).toBe('1');
    expect(root.classList.contains('grid')).toBe(true);
    expect(root.children.length).toBe(2);
    expect(root.textContent).toContain('two');
  });

  it('honors the `as` prop so a list group stays semantic (ol/ul)', () => {
    vi.stubEnv('VITE_SCROLL_CINEMA', '1');
    const { container } = render(
      <DepthCascade as="ol">
        <li>a</li>
        <li>b</li>
      </DepthCascade>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('OL');
    expect(root.classList.contains('ps-depth-cascade')).toBe(true);
    expect(root.querySelectorAll('li').length).toBe(2);
  });
});
