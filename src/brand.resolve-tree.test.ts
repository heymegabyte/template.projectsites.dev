import { describe, it, expect } from 'vitest';
import { resolveTree } from './brand.ts';

/**
 * Regression for AL-338 — the studio-q/methodical hydration crash.
 *
 * `resolveTree` runs at MODULE LOAD (`resolveTree(raw, raw)`), so an unbounded
 * recursion there throws an UNCAUGHT `RangeError: Maximum call stack size
 * exceeded` during bundle eval — BEFORE React mounts and BEFORE applyBrand — and
 * the ErrorBoundary can't catch it (it's outside the React tree). Ground truth:
 * crashed sites showed `fh→mh→mh…` (minified `resolveTree`) + `data-style:null` +
 * a dead prerender-only shell. A malformed AI `_brand.json` with runaway nesting
 * was the trigger. The depth guard must make that structurally impossible.
 */
describe('resolveTree depth guard (AL-338)', () => {
  /** Build a DTCG tree nested `n` levels deep (well past the JS stack limit). */
  function deepTree(n: number): Record<string, unknown> {
    const root: Record<string, unknown> = {};
    let cur = root;
    for (let i = 0; i < n; i++) {
      const child: Record<string, unknown> = {};
      cur.child = child;
      cur = child;
    }
    cur.leaf = { $value: 'deep' };
    return root;
  }

  it('does NOT throw a RangeError on a pathologically deep tree (10k levels)', () => {
    // Without the guard this recurses 10_000 frames deep → stack overflow.
    expect(() => resolveTree(deepTree(10_000), {})).not.toThrow();
  });

  it('resolves a normal shallow brand tree correctly (no regression)', () => {
    const tree = {
      color: { brand: { $value: '#00e5ff' } },
      font: { heading: { $value: 'Inter' } },
      nested: { a: { b: { c: { $value: 'ok' } } } }, // 4 levels — well under the cap
    };
    const out = resolveTree(tree, tree) as Record<string, Record<string, unknown>>;
    expect((out.color.brand as unknown)).toBe('#00e5ff');
    expect((out.font.heading as unknown)).toBe('Inter');
    expect((((out.nested.a as Record<string, Record<string, unknown>>).b.c) as unknown)).toBe('ok');
  });

  it('resolves alias references + honors $-prefixed metadata skip', () => {
    const tree = {
      color: { hue: { $value: '195' }, brand: { $value: 'oklch(0.7 0.2 {color.hue})' } },
      $description: 'skipped', // $-prefixed keys are not walked
    };
    const out = resolveTree(tree, tree) as Record<string, Record<string, unknown>>;
    expect((out.color.brand as unknown)).toBe('oklch(0.7 0.2 195)');
    expect(out.$description).toBeUndefined();
  });
});
