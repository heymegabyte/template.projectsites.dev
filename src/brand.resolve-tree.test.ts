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

/**
 * Regression for AL-352 — THE themeStyle root cause (proven via ps-build-diag.txt:
 * `_brand.json.themeStyle=scholarly` yet the live site rendered `data-style=boutique`).
 *
 * A top-level plain-string value (`themeStyle:"scholarly"`) is NOT a DTCG leaf, so the
 * old resolveTree hit `Object.entries("scholarly")` → spread it into a char-indexed
 * object `{0:'s',1:'c',…}`. brand.ts reads `r.themeStyle` off the RESOLVED tree and
 * gates on `typeof r.themeStyle === 'string'`; the char-object failed that check, so
 * `explicitStyle` was always null and EVERY site fell back to
 * presetForClass(businessClass) — the deterministic/sidecar themeStyle never landed.
 */
describe('resolveTree primitive/array passthrough (AL-352 — themeStyle survives)', () => {
  it('keeps a top-level plain-string themeStyle a STRING (was char-mangled to {0:…})', () => {
    const tree = {
      themeStyle: 'scholarly',
      business: { name: { $value: 'Powell’s' } },
      color: { brand: { $value: '#00e5ff' } },
    };
    const out = resolveTree(tree, tree) as Record<string, unknown>;
    expect(typeof out.themeStyle).toBe('string'); // the exact brand.ts gate
    expect(out.themeStyle).toBe('scholarly'); // not {0:'s',1:'c',…}
    // sibling DTCG tokens still resolve (no regression)
    expect(((out.business as Record<string, unknown>).name as unknown)).toBe('Powell’s');
  });

  it('keeps an array value an ARRAY (font.weights was mangled to {0:…})', () => {
    const tree = { font: { weights: [400, 600, 700], heading: { $value: 'Inter' } } };
    const out = resolveTree(tree, tree) as Record<string, Record<string, unknown>>;
    expect(Array.isArray(out.font.weights)).toBe(true);
    expect(out.font.weights).toEqual([400, 600, 700]);
    expect((out.font.heading as unknown)).toBe('Inter');
  });

  it('passes primitives through unchanged (number, boolean, null)', () => {
    const tree = { n: 42, b: true, z: null, s: 'plain' };
    const out = resolveTree(tree, tree) as Record<string, unknown>;
    expect(out.n).toBe(42);
    expect(out.b).toBe(true);
    expect(out.z).toBeNull();
    expect(out.s).toBe('plain');
  });
});
