import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { wordmarkTooSquare, wordmarkContrastsTheme } from './Header';

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

/**
 * AL-617: the wordmark PNG can bake INK that doesn't contrast the theme the icon-luminance logic
 * chose (a DARK-ink wordmark on a DARK header, or light-on-light) → an illegible smear even at a
 * valid banner aspect. Measured live on alpenglow-sports-tahoe-city: wordmark ink luminance 25/255
 * on a dark header (icon 178 = light, so the dark theme was correct — the wordmark just didn't
 * match). `wordmarkContrastsTheme` decides whether to render the PNG or fall back to the always-
 * theme-correct text wordmark.
 */
describe('wordmarkContrastsTheme — fall back to text when the wordmark ink fights the theme', () => {
  it('DARK ink on a DARK header does NOT contrast → fall back to text', () => {
    expect(wordmarkContrastsTheme(25, true), 'alpenglow live case (ink 25 on dark)').toBe(false);
    expect(wordmarkContrastsTheme(60, true), 'still-dark ink on dark').toBe(false);
  });
  it('LIGHT ink on a LIGHT header does NOT contrast → fall back to text', () => {
    expect(wordmarkContrastsTheme(220, false), 'near-white ink on a light header').toBe(false);
    expect(wordmarkContrastsTheme(200, false)).toBe(false);
  });
  it('correct-polarity ink CONTRASTS → render the PNG', () => {
    expect(wordmarkContrastsTheme(178, true), 'light ink on dark (alpenglow ICON case)').toBe(true);
    expect(wordmarkContrastsTheme(30, false), 'dark ink on light').toBe(true);
  });
  it('the ambiguous mid band + unmeasurable input are trusted (render the PNG)', () => {
    expect(wordmarkContrastsTheme(128, true)).toBe(true);
    expect(wordmarkContrastsTheme(128, false)).toBe(true);
    expect(wordmarkContrastsTheme(NaN, true)).toBe(true);
  });
});

describe('Header wires the wordmark guards to onLoad (aspect + ink contrast, not just onError)', () => {
  it('the PNG wordmark img gates on wordmarkTooSquare AND wordmarkContrastsTheme in onLoad', () => {
    const imgAt = SRC.indexOf('src="/logo-wordmark.png"');
    const block = imgAt >= 0 ? SRC.slice(imgAt, imgAt + 2800) : '';
    expect(block).toMatch(/onLoad=/);
    expect(block).toMatch(/wordmarkTooSquare\(/);
    expect(block).toMatch(/naturalWidth/);
    // AL-617 ink-contrast gate: canvas-sample the ink + decide via wordmarkContrastsTheme
    expect(block).toMatch(/wordmarkContrastsTheme\(/);
    expect(block).toMatch(/getImageData|getContext/);
    expect(block).toMatch(/data-theme|prefers-color-scheme/);
  });
});

/**
 * AL-591: ~4/9 sampled deployed sites (gentle-dental / vanta / ironhaus / martin-agency) never
 * generated /logo-wordmark.png, so the old optimistic `<img src>` fired a hard 404 → a console
 * error (a hard-gate break) on every such site. The fix: default to the text wordmark and only
 * upgrade to the PNG once a fetch-HEAD confirms it exists — a fetch 404 is SILENT (no console
 * error), unlike an <img> 404. This guards that the console-error-free probe stays wired.
 */
/**
 * logo-contrast backing (fire-72): UNSCROLLED, the header is transparent over the hero, so the
 * brand mark floats on the hero image. A single fixed-direction drop-shadow does NOT separate ink
 * from a same-luminance hero region (measured ~1.1:1 — a hard AA fail). index.css must give the
 * unscrolled brand link a polarity-correct semi-opaque BACKING chip (dark chip on dark themes →
 * ~6.1:1 light ink; light chip on light themes → ~6.7:1 dark ink) + a dual-direction halo on the
 * mark. This guards both so a refactor can't silently drop the only every-site AA-safe wordmark lever.
 */
describe('logo-contrast: unscrolled brand mark has a theme-correct backing + dual halo', () => {
  const CSS = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

  it('the unscrolled (transparent) header backs the brand link with a translucent chip', () => {
    expect(CSS, 'need a .site-header[data-scrolled="false"] .site-brand backing rule').toMatch(
      /\.site-header\[data-scrolled="false"\]\s+\.site-brand\s*\{[^}]*background:/,
    );
  });

  it('the backing is theme-polarity-aware (a distinct light-theme chip for dark ink)', () => {
    expect(CSS).toMatch(
      /:root\[data-theme="light"\]\s+\.site-header\[data-scrolled="false"\]\s+\.site-brand/,
    );
  });

  it('the mark carries a DUAL-direction halo (dark + light) so edges read on any hero', () => {
    const at = CSS.indexOf('.site-brand .site-wordmark-text');
    expect(at, 'need a halo rule on the brand mark').toBeGreaterThan(-1);
    // dark-theme default halo declares BOTH a dark and a light drop-shadow/text-shadow layer.
    const block = CSS.slice(at, at + 260);
    expect(block, 'dark-theme halo must stack a dark + a light layer').toMatch(
      /oklch\(0 0 0[^)]*\)[\s\S]*oklch\(1 0 0/,
    );
  });

  it('respects prefers-reduced-transparency (chip becomes opaque, no backdrop blur)', () => {
    expect(CSS).toMatch(/prefers-reduced-transparency:\s*reduce/);
  });
});

describe('AL-591: wordmark PNG is existence-probed (silent) before render, not optimistically 404d', () => {
  it('wordmarkOk defaults to false (the text wordmark is the baseline, never a broken <img>)', () => {
    expect(SRC).toMatch(/const\s*\[\s*wordmarkOk\s*,\s*setWordmarkOk\s*\]\s*=\s*useState\(false\)/);
  });
  it('a fetch HEAD probes /logo-wordmark.png and only setWordmarkOk(true) when it exists', () => {
    expect(SRC).toMatch(/fetch\(\s*['"]\/logo-wordmark\.png['"]\s*,\s*\{\s*method:\s*['"]HEAD['"]/);
    const at = SRC.indexOf("fetch('/logo-wordmark.png'");
    const block = at >= 0 ? SRC.slice(at, at + 260) : '';
    expect(block).toMatch(/r\.ok/);
    expect(block).toMatch(/setWordmarkOk\(true\)/);
  });
  it('does NOT render the wordmark <img> optimistically (no useState(true) for wordmarkOk)', () => {
    expect(SRC).not.toMatch(/wordmarkOk[^\n]*useState\(true\)/);
  });
});
