import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChunkBoundary } from './Layout';

/**
 * AL-571 — a failed lazy `import()` (chunk 404 / CDN blip / stale-deploy hash mismatch) must
 * NOT crash the whole site. `ChunkBoundary` swallows the render error and renders `null` so the
 * non-critical interaction chrome (Lightbox / Command Palette / dev badge) simply goes absent
 * while the eager Header/main/Footer survive. Reference incident: olson-kundig-seattle rendered
 * ONLY "Something went wrong" because a stale DevA11yBadge-*.js 404 propagated past <Suspense>.
 */
function Boom(): never {
  throw new Error('Failed to fetch dynamically imported module');
}

describe('ChunkBoundary (AL-571 — a failed lazy chunk must not dark the whole site)', () => {
  it('renders its children normally when nothing throws', () => {
    render(
      <ChunkBoundary>
        <span data-testid="chrome">ok</span>
      </ChunkBoundary>,
    );
    expect(screen.getByTestId('chrome')).toBeTruthy();
  });

  it('renders null (not a crash) when a child throws a chunk-load error', () => {
    // React logs the caught error to console.error — silence it for a clean test run.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <ChunkBoundary>
        <Boom />
      </ChunkBoundary>,
    );
    // The boundary swallowed the error → empty output, NOT a thrown/propagated crash.
    expect(container.textContent).toBe('');
    spy.mockRestore();
  });
});
