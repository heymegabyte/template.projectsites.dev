import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { wordmarkTooSquare } from './Header';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, './Header.tsx'), 'utf8');

/**
 * Guards the navbar wordmark against the two defects Brian flagged 2026-09-11:
 *   (1) a long business name wrapping to an UGLY MULTI-LINE logo, and
 *   (2) the text wordmark being illegible against the navbar colour (the PNG
 *       wordmark carries a drop-shadow halo; the text fallback used to have none).
 * The HTML text fallback (the COMMON case — most sites have no /logo-wordmark.png)
 * MUST: stay SINGLE-LINE (`truncate` ⇒ white-space:nowrap + ellipsis safety),
 * carry a text-shadow halo so it reads over a transparent-nav hero, and be
 * prominent (a decent fluid clamp size, never a small fixed text). The brand Link
 * MUST allow the wordmark to shrink (`min-w-0`) instead of overflowing the navbar,
 * and the icon mark MUST stay `shrink-0` so only the wordmark text ever shrinks.
 */
describe('Header navbar wordmark — single-line, legible, prominent', () => {
  // Isolate the text-wordmark fallback <span> (the `wordmarkOk ? <img> : <span>` else branch).
  const at = SRC.indexOf('site-wordmark-text');
  const fallback = at >= 0 ? SRC.slice(at, at + 400) : '';

  it('the text wordmark fallback exists (className site-wordmark-text)', () => {
    expect(at, 'text wordmark fallback span must be present').toBeGreaterThan(-1);
  });

  it('never wraps to multiple lines (truncate ⇒ white-space:nowrap)', () => {
    expect(fallback, 'text wordmark must be single-line').toMatch(/\btruncate\b|whitespace-nowrap/);
  });

  it('carries a contrast halo so it reads over a transparent-nav hero (parity with the PNG drop-shadow)', () => {
    expect(fallback).toMatch(/text-shadow|drop-shadow/);
  });

  it('is prominent — a fluid clamp size, never a small fixed text-sm/xs', () => {
    expect(fallback).toMatch(/clamp\(/);
    expect(fallback).not.toMatch(/\btext-(sm|xs)\b/);
  });

  it('the brand Link is min-w-0 so the wordmark shrinks instead of overflowing the navbar', () => {
    const linkAt = SRC.indexOf('site-brand');
    expect(SRC.slice(linkAt, linkAt + 180)).toContain('min-w-0');
  });

  it('the icon mark stays shrink-0 (only the wordmark text ever shrinks)', () => {
    expect(SRC).toMatch(/site-logo[^"]*shrink-0/);
  });

  it('the PNG wordmark also keeps the drop-shadow halo (contrast in both render paths)', () => {
    const imgAt = SRC.indexOf('site-wordmark ');
    expect(SRC.slice(imgAt, imgAt + 200)).toMatch(/drop-shadow/);
  });
});

/**
 * AL-454: a near-square wordmark asset LOADS fine (no onError) but squishes to an
 * illegible smear at navbar height (Parnassus Books shipped a 1024×894 = 1.15:1
 * wordmark that rendered as a ~55px blob). `wordmarkTooSquare` decides — on the real
 * loaded dimensions — whether to fall back to the crisp styled text wordmark.
 */
describe('wordmarkTooSquare — fall back to text when the wordmark asset is too square', () => {
  it('flags near-square / padded wordmarks (below 2:1) → fall back to legible text', () => {
    expect(wordmarkTooSquare(1024, 894), '1.15:1 (Parnassus Books, untrimmed)').toBe(true);
    expect(wordmarkTooSquare(1312, 736), '1.78:1 (Ideogram ASPECT_16_9 padded)').toBe(true);
    expect(wordmarkTooSquare(512, 512), '1:1 square logo').toBe(true);
    expect(wordmarkTooSquare(900, 500), '1.8:1 still too square for the navbar').toBe(true);
  });
  it('accepts genuine horizontal banners (2:1 and wider) → render the PNG', () => {
    expect(wordmarkTooSquare(520, 150), '3.47:1 (AL-392 trimmed banner)').toBe(false);
    expect(wordmarkTooSquare(1200, 400), '3:1 (ASPECT_3_1 target)').toBe(false);
    expect(wordmarkTooSquare(1000, 500), 'exactly 2:1 is the accepted floor').toBe(false);
  });
  it('is safe on unmeasurable dims (0 / NaN) → trust the asset, onError still guards a broken one', () => {
    expect(wordmarkTooSquare(0, 0)).toBe(false);
    expect(wordmarkTooSquare(NaN, 100)).toBe(false);
    expect(wordmarkTooSquare(100, 0)).toBe(false);
  });
});

describe('Header wires the wordmark aspect guard to onLoad (not just onError)', () => {
  it('the PNG wordmark img calls wordmarkTooSquare in onLoad', () => {
    const imgAt = SRC.indexOf('src="/logo-wordmark.png"');
    const block = imgAt >= 0 ? SRC.slice(imgAt, imgAt + 700) : '';
    expect(block).toMatch(/onLoad=/);
    expect(block).toMatch(/wordmarkTooSquare\(/);
    expect(block).toMatch(/naturalWidth/);
  });
});
