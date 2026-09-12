import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Regression for the delivered-site defect surfed 2026-08-27: the `--color-text-subtle`
 * design token failed WCAG AA color-contrast on EVERY generated site, both themes.
 * It was `oklch(0.45 0.01 240)` dark (2.61:1 on surface-elevated — effectively illegible)
 * and `oklch(0.58 0.01 hue)` light (3.59:1 on surface-elevated), yet it drives real
 * informational text: `.cmdk-kbd` keyboard hints, breadcrumbs, form placeholders, the
 * QuoteForm "(optional)" note, Search "no results", CommandPalette descriptions.
 *
 * The token is defined in THREE places that must stay in lockstep and all AA-safe:
 *   - src/index.css            (the CSS fallback, dark `:root` + light `[data-theme]`)
 *   - src/brand.ts             (DEFAULT_BRAND.color.textSubtle — applyBrand() writes it
 *                               as an inline :root style at boot, overriding the CSS)
 *   - src/pages/Studio.tsx     (the brand-tuning preview + DTCG token export baked into
 *                               generated sites' brand.color)
 *
 * Fix: dark 0.45→0.60, light 0.58→0.49 — chosen (a) AA-safe on the WORST-CASE neutral
 * surface (surface-elevated) across all brand hues, and (b) still less-contrast than
 * `--color-text-muted`, so the muted→subtle hierarchy survives. This test reads the
 * SOURCE values (not hard-coded copies) and re-derives the WCAG ratio, so any drift
 * back below AA in any of the three sources fails.
 *
 * Why one L value works for every brand hue: subtle/muted carry chroma 0.01 (near-gray),
 * so hue has <0.05:1 effect on the contrast ratio — proven by the hue sweep below.
 */

const AA = 4.5; // WCAG 2.1 SC 1.4.3 — normal text (.cmdk-kbd is 12px, not "large")

// ── OKLCH → 8-bit sRGB → WCAG relative luminance → contrast (matches a browser/axe) ──
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
function oklchToRgb255(L: number, C: number, Hdeg: number): [number, number, number] {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const enc = (c: number) => {
    c = clamp01(c);
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  return lin.map((v) => Math.round(enc(v) * 255)) as [number, number, number];
}
function relLum([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(fg: [number, number, number], bg: [number, number, number]): number {
  const [hi, lo] = [relLum(fg), relLum(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}
const ratio = (fg: OKLCH, bg: OKLCH, hue = 240) =>
  contrast(oklchToRgb255(fg.L, fg.C, fg.H ?? hue), oklchToRgb255(bg.L, bg.C, bg.H ?? hue));

// ── Parse `oklch(L C H)` where H may be a literal or a var/DTCG hue reference ──
interface OKLCH {
  L: number;
  C: number;
  H: number | null;
}
function parseOklch(src: string): OKLCH {
  const m = src.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+(var\(--brand-hue\)|\{color\.brandHue\}|\$\{hue\}|[\d.]+)\s*\)/);
  if (!m) throw new Error(`no oklch() in: ${src}`);
  const H = /^[\d.]+$/.test(m[3]) ? Number(m[3]) : null; // null = hue-generic (var)
  return { L: Number(m[1]), C: Number(m[2]), H };
}
/** First `<prop>: oklch(...)` inside a scoped block of source text. */
function tokenIn(block: string, prop: string): OKLCH {
  const m = block.match(new RegExp(`${prop.replace(/[-[\]]/g, '\\$&')}[^;\\n]*?(oklch\\([^;]*\\))`));
  if (!m) throw new Error(`token ${prop} not found`);
  return parseOklch(m[1]);
}

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const HUES = [30, 195, 240, 340]; // warm, teal, blue, magenta — the brand-hue range

describe('--color-text-subtle clears WCAG AA on the worst-case surface (all 3 sources)', () => {
  it('index.css: dark subtle ≥ 4.5:1 on dark surface-elevated', () => {
    const css = read('./index.css');
    const dark = css.slice(0, css.indexOf("[data-theme='light']"));
    const subtle = tokenIn(dark, '--color-text-subtle');
    const surfElev = tokenIn(dark, '--color-surface-elevated');
    expect(ratio(subtle, surfElev)).toBeGreaterThanOrEqual(AA);
  });

  it('index.css: light subtle ≥ 4.5:1 on light surface-elevated, every brand hue', () => {
    const css = read('./index.css');
    const light = css.slice(css.indexOf("[data-theme='light']"));
    const subtle = tokenIn(light, '--color-text-subtle');
    const surfElev = tokenIn(light, '--color-surface-elevated');
    for (const hue of HUES) expect(ratio(subtle, surfElev, hue), `hue ${hue}`).toBeGreaterThanOrEqual(AA);
  });

  it('brand.ts DEFAULT_BRAND (applied inline at boot) subtle ≥ 4.5:1 on its surface-elevated', () => {
    const ts = read('./brand.ts');
    const subtle = parseOklch(ts.match(/textSubtle:\s*'(oklch\([^']*\))'/)![1]);
    const surfElev = parseOklch(ts.match(/surfaceElevated:\s*'(oklch\([^']*\))'/)![1]);
    expect(ratio(subtle, surfElev)).toBeGreaterThanOrEqual(AA);
  });

  it('Studio.tsx runtime preview: both light & dark subtle ≥ 4.5:1 on matching surface-elevated', () => {
    const tsx = read('./pages/Studio.tsx');
    // setProperty('--color-text-subtle', mode==='light' ? oklch(light) : oklch(dark))
    const line = tsx.match(/setProperty\('--color-text-subtle'[^;]*/)![0];
    const [lightSubtle, darkSubtle] = [...line.matchAll(/oklch\([^`]*\)/g)].map((m) => parseOklch(m[0]));
    const surfLine = tsx.match(/setProperty\('--color-surface-elevated'[^;]*/)![0];
    const [lightSurf, darkSurf] = [...surfLine.matchAll(/oklch\([^`]*\)/g)].map((m) => parseOklch(m[0]));
    for (const hue of HUES) {
      expect(ratio(lightSubtle, lightSurf, hue), `light hue ${hue}`).toBeGreaterThanOrEqual(AA);
      expect(ratio(darkSubtle, darkSurf, hue), `dark hue ${hue}`).toBeGreaterThanOrEqual(AA);
    }
  });

  it('subtle stays less-contrast than muted (muted→subtle hierarchy preserved)', () => {
    const css = read('./index.css');
    const dark = css.slice(0, css.indexOf("[data-theme='light']"));
    const surfElev = tokenIn(dark, '--color-surface-elevated');
    const subtle = tokenIn(dark, '--color-text-subtle');
    const muted = tokenIn(dark, '--color-text-muted');
    expect(ratio(subtle, surfElev)).toBeLessThan(ratio(muted, surfElev));
  });

  it('near-gray token (chroma 0.01) is hue-independent — one L works for all brands', () => {
    const subtle: OKLCH = { L: 0.49, C: 0.01, H: null };
    const surf: OKLCH = { L: 0.94, C: 0.01, H: null };
    const ratios = HUES.map((h) => ratio(subtle, surf, h));
    expect(Math.max(...ratios) - Math.min(...ratios)).toBeLessThan(0.1);
  });

  /**
   * §C.3 regression (surfed 2026-09-07 on vanta-strength-austin): `--color-text-muted`
   * drives real body copy (team-role-card description, StatCounter, Timeline), and
   * `applyBrand()` can set an arbitrarily dark `--color-background` per brand — vanta's is
   * `#0d0706` (near-black, DARKER than `--color-surface-elevated`), where the delivered
   * muted was only 3.51:1 → an axe `color-contrast` [serious] fail at 375/390px. The
   * existing tests only checked `subtle` vs `surface-elevated`; MUTED vs the darkest/lightest
   * possible brand surface was the blind spot. The CSS token is `!important` (so applyBrand
   * can't darken it); assert it clears AA on PURE BLACK (dark) / PURE WHITE (light) so it
   * holds for ANY brand's surface, not just the neutral elevated one.
   */
  it('MUTED body-copy clears 4.5:1 on the WORST-CASE brand surface per scheme (near-black / white)', () => {
    const css = read('./index.css');
    const dark = css.slice(0, css.indexOf("[data-theme='light']"));
    const light = css.slice(css.indexOf("[data-theme='light']"));
    const darkMuted = tokenIn(dark, '--color-text-muted');
    const lightMuted = tokenIn(light, '--color-text-muted');
    const black: OKLCH = { L: 0, C: 0, H: null };
    const white: OKLCH = { L: 1, C: 0, H: null };
    for (const hue of HUES) {
      expect(ratio(darkMuted, black, hue), `dark muted on near-black, hue ${hue}`).toBeGreaterThanOrEqual(AA);
      expect(ratio(lightMuted, white, hue), `light muted on white, hue ${hue}`).toBeGreaterThanOrEqual(AA);
    }
  });
});

/**
 * §C.3 (reopened AL-213/140, surfed live on char-bar + harborline): a scroll-timeline
 * reveal that fades `opacity: 0→1` composites the card's MUTED body copy at partial alpha,
 * and axe measures the EFFECTIVE (composited) color at the mid-`entry` frame. Muted
 * oklch(0.42) at ~0.70α over the cream card surface reads #89817c = 3.4:1 @375/390px on
 * EVERY team-bearing site — the reopened violation. Fix (index.css `team-role-rise`): floor
 * the reveal opacity at 0.9 so the body copy holds ≥4.5:1 at every animation frame while
 * keeping a soft fade+slide. This locks it: the OLD 0.70 fails, the NEW 0.9 clears, and the
 * shipped keyframe carries opacity ≥0.9. (generated-site-accent-text-contrast / opacity-on-
 * muted-token class — the reveal can never drop legibility below AA.)
 */
describe('scroll-reveal opacity floor keeps muted body copy AA (§C.3 team-role-rise)', () => {
  const composite = (
    fg: [number, number, number],
    bg: [number, number, number],
    alpha: number,
  ): [number, number, number] =>
    [0, 1, 2].map((i) => Math.round(alpha * fg[i] + (1 - alpha) * bg[i])) as [number, number, number];
  // Read the light muted L from index.css (was hardcoded 0.42 → a token lightening would slip
  // past this lock). Now a regression that lightens --color-text-muted fails the test. (AL-434)
  const MUTED_L = (() => {
    const c = read('./index.css');
    return tokenIn(c.slice(c.indexOf("[data-theme='light']")), '--color-text-muted').L;
  })();
  const CREAM_L = 0.93; // the axe-measured card surface (#fcf0e3) — the tightest light bg

  it('OLD 0.70 mid-fade FAILED AA on cream (documents the reopened bug)', () => {
    for (const hue of HUES) {
      const muted = oklchToRgb255(MUTED_L, 0.01, hue);
      const cream = oklchToRgb255(CREAM_L, 0.02, hue);
      expect(contrast(composite(muted, cream, 0.7), cream), `hue ${hue}`).toBeLessThan(AA);
    }
  });
  it('NEW 0.9 reveal floor CLEARS 4.5:1 on cream across every brand hue', () => {
    for (const hue of HUES) {
      const muted = oklchToRgb255(MUTED_L, 0.01, hue);
      const cream = oklchToRgb255(CREAM_L, 0.02, hue);
      expect(contrast(composite(muted, cream, 0.9), cream), `hue ${hue}`).toBeGreaterThanOrEqual(AA);
    }
  });
  // EVERY text-container scroll-reveal must floor from{opacity} ≥ 0.9 — not just team-role-rise.
  // The mid-entry composite failed on `.mt-2` (rise-in) + `.team-role-card` (rise-in) too: axe caught
  // #7b8185/#17211b=4.19 (dark) + #89817c/cream=3.4 (light) — the SAME AL-290 class on the sibling
  // keyframes AL-290 didn't cover. Generalized (AL-440): drift guard fails if any of these fades text
  // from below 0.9. Decorative pops with NO body text (process-node-pop dot) are intentionally exempt.
  const TEXT_REVEAL_KEYFRAMES = [
    'team-role-rise', 'rise-in', 'trust-chip-rise',
    'stat-rollup-rise', 'stat-tile-rise', 'process-card-rise', 'team-card-rise',
  ];
  it('index.css: EVERY text-container reveal keyframe floors from{opacity} ≥ 0.9', () => {
    const css = read('./index.css');
    for (const name of TEXT_REVEAL_KEYFRAMES) {
      const at = css.indexOf(`@keyframes ${name}`);
      expect(at, `${name} keyframe present`).toBeGreaterThan(-1);
      const from = css.slice(at, css.indexOf('}', at));
      const m = from.match(/opacity:\s*([\d.]+)/);
      expect(m, `${name} from{opacity} present`).toBeTruthy();
      expect(parseFloat(m![1]), `${name} reveal opacity floor ≥0.9`).toBeGreaterThanOrEqual(0.9);
    }
  });
});

/**
 * §C.3 accent-AS-TEXT lock (reopened AL-213, fixed AL-417, LOCKED AL-434): eyebrows, labels,
 * contact links and directory cards (`.lm-dir`) that colour TEXT with the accent route through
 * `--color-accent-readable`, which FORCES a dark lightness (keeping the brand accent's chroma/
 * hue) so a light/warm accent (gold ~1.6:1 raw) stays legible on the cream light surface.
 * harborline shipped the OLD forced L=0.44 → `.lm-dir` = 4.47:1 (a hair under AA); AL-417
 * dropped it to 0.38 (≈8–10:1). Nothing locked that L against a future lightening — this does,
 * reading the forced L from index.css and checking worst-case (vivid) accent chroma × hue.
 */
describe('§C.3 accent-as-text (--color-accent-readable) clears AA on cream (AL-434)', () => {
  const light = (() => {
    const c = read('./index.css');
    return c.slice(c.indexOf("[data-theme='light']"));
  })();
  const accReadableL = Number(
    (light.match(/--color-accent-readable:\s*oklch\(from var\(--color-accent\)\s*([\d.]+)/) || [])[1],
  );
  const cream = tokenIn(light, '--color-background');

  it('the forced accent-readable lightness is present + dark enough to matter', () => {
    expect(accReadableL, '--color-accent-readable forced L parsed from index.css light block').toBeGreaterThan(0);
    expect(accReadableL, 'forced L stays dark (a light forced-L defeats the purpose)').toBeLessThanOrEqual(0.45);
  });
  it('accent-as-text clears 4.5:1 on cream at worst-case chroma, every brand hue', () => {
    for (const hue of HUES) {
      const creamRgb = oklchToRgb255(cream.L, cream.C, cream.H ?? hue);
      for (const C of [0.06, 0.12, 0.18]) {
        // vivid accents are the hard case at a fixed dark L — assert even those clear AA.
        const acc = oklchToRgb255(accReadableL, C, hue);
        expect(
          contrast(acc, creamRgb),
          `accent-readable L${accReadableL} C${C} hue${hue} on cream`,
        ).toBeGreaterThanOrEqual(AA);
      }
    }
  });
});
