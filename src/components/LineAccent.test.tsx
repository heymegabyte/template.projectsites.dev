import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LineAccent } from './LineAccent';

/**
 * LineAccent (`line_draw` / VITE_LINE_DRAW, dark by default). Locks the flag gate + the decorative
 * contract: renders NOTHING when off; when on, an `aria-hidden` SVG with a single stroke `path`
 * (the base CSS keeps it fully-drawn, so reduced-motion / no-`@supports` never strand an
 * invisible line — asserted by the prod probe `e2e/verify-line-draw.mjs`).
 */
describe('LineAccent — line_draw gate (dark by default)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('renders NOTHING when the flag is off (default)', () => {
    const { container } = render(<LineAccent />);
    expect(container.querySelector('svg'), 'no SVG when the flag is off').toBeNull();
    expect(container.querySelector('.ps-line-accent')).toBeNull();
  });

  it('renders a decorative aria-hidden stroke SVG when VITE_LINE_DRAW=1', () => {
    vi.stubEnv('VITE_LINE_DRAW', '1');
    const { container } = render(<LineAccent className="mt-3" />);
    const svg = container.querySelector('svg.ps-line-accent') as SVGElement | null;
    expect(svg, 'the accent SVG renders when the flag is on').not.toBeNull();
    expect(svg!.getAttribute('aria-hidden'), 'decorative — never in the a11y tree').toBe('true');
    expect(svg!.getAttribute('focusable')).toBe('false');
    expect(svg!.classList.contains('mt-3'), 'caller className passes through').toBe(true);
    const path = svg!.querySelector('path');
    expect(path, 'a single stroke path is present (the drawn line)').not.toBeNull();
    expect(path!.getAttribute('stroke'), 'inherits text-accent via currentColor').toBe('currentColor');
  });
});
