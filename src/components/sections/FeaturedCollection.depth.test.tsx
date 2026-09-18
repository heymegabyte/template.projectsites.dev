import { render } from '@testing-library/react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { FeaturedCollection } from './FeaturedCollection';

/**
 * CINEMATIC-3D — the retail product grid is upgraded from the flat `.reveal-on-view` rise to the
 * 3D `<DepthCascade>` "content emerges from depth" scroll narrative (motion.so / Awwwards signature).
 * Both are native `animation-timeline: view()` with the SAME static-visible fallback, so the swap is
 * a zero-regression upgrade. This locks the STRUCTURAL contract jsdom can assert:
 *   1. the grid carries `.ps-depth-cascade` + `data-depth-cascade` by default (scroll_cinema promoted);
 *   2. NO card double-animates (they drop `reveal-on-view` — the cascade owns the entrance);
 *   3. the killswitch (VITE_SCROLL_CINEMA=0) degrades to a plain grid with every card still present.
 * The compositor keyframes themselves are proven in a real browser by verify-scroll-cinema.mjs.
 */
afterEach(() => vi.unstubAllEnvs());

const items = [
  { name: 'Aurora Ring', price: '$120', image: 'https://cdn.example.com/a.jpg', href: '/p/a', badge: 'New' },
  { name: 'Halo Band', price: '$98', image: 'https://cdn.example.com/b.jpg' },
  { name: 'Lumen Pendant', price: '$210', image: 'https://cdn.example.com/c.jpg', href: '/p/c' },
  { name: 'Solace Cuff', price: '$164', image: 'https://cdn.example.com/d.jpg' },
];

describe('FeaturedCollection — DepthCascade wiring (scroll_cinema, default-on) [CINEMATIC-3D]', () => {
  it('wraps the product grid in the 3D depth-cascade by default (ps-depth-cascade + data hook)', () => {
    const { container } = render(<FeaturedCollection items={items} headline="Shop the collection" />);
    const grid = container.querySelector('.ps-depth-cascade') as HTMLElement | null;
    expect(grid).not.toBeNull();
    expect(grid!.getAttribute('data-depth-cascade')).toBe('1');
    // It IS the product grid (carries the layout classes) and the cards are its DIRECT children.
    expect(grid!.classList.contains('grid')).toBe(true);
    expect(grid!.classList.contains('grid-cols-2')).toBe(true);
    expect(grid!.children.length).toBe(items.length);
  });

  it('does NOT double-animate: product cards drop reveal-on-view (the cascade owns the entrance)', () => {
    const { container } = render(<FeaturedCollection items={items} headline="Shop the collection" />);
    const grid = container.querySelector('.ps-depth-cascade') as HTMLElement;
    // A direct-child card carrying reveal-on-view would stack its rise transform on the cascade's.
    expect(grid.querySelectorAll(':scope > .reveal-on-view').length).toBe(0);
  });

  it('killswitch VITE_SCROLL_CINEMA=0 → plain grid, no cascade, every card still renders', () => {
    vi.stubEnv('VITE_SCROLL_CINEMA', '0');
    const { container } = render(<FeaturedCollection items={items} headline="Shop the collection" />);
    expect(container.querySelector('.ps-depth-cascade')).toBeNull();
    const grid = container.querySelector('.grid-cols-2') as HTMLElement | null;
    expect(grid).not.toBeNull();
    expect(grid!.children.length).toBe(items.length);
  });
});
