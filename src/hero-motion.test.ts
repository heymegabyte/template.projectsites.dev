import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

/**
 * Regression guard for the CINEMATIC HERO MOTION — the beauty that makes a generated hero feel
 * alive on BOTH theme polarities:
 *   • the hero IMAGE slow Ken-Burns scale/pan (`hero-kenburns`) — HeroSplit's LCP image,
 *   • the drifting backdrop auroras (`hero-aurora-drift` + `hero-center-bloom`) — the light-theme
 *     hero's cinematic layer (dark themes ALSO get the WebGL field; light themes rely on these
 *     pale drifting blobs, which — unlike a dark WebGL field — can't hurt dark-on-light contrast,
 *     AL-448).
 * The template has been bitten twice by beauty silently regressing (the AL-290/440 reveal-opacity
 * composite; the AL-213 dead WebGL backdrop). Nothing guarded the HERO motion — a refactor could
 * strip the Ken-Burns class, drop a keyframe, or (worst) un-gate the motion from
 * `prefers-reduced-motion`, and every render/console/axe gate would still pass. This locks:
 *   (1) the hero <img> carries `hero-kenburns`,
 *   (2) all three cinematic keyframes exist (with a real transform),
 *   (3) EVERY hero-motion animation is reduced-motion-gated (static base for reduced-motion / no-JS).
 *
 * vitest runs from the repo root → cwd-relative reads (robust; some transforms leave import.meta.url
 * as a non-file scheme, which breaks new URL('../…')).
 */
const CSS = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
const HERO = readFileSync(resolve(process.cwd(), 'src/components/sections/HeroVariants.tsx'), 'utf8');

/** True iff every `animation:` that references `name` sits inside a
 *  `@media (prefers-reduced-motion: no-preference)` block (reduced-motion-safe). */
function animationIsReducedMotionGated(css: string, name: string): boolean {
  const NO_PREF = '@media (prefers-reduced-motion: no-preference)';
  // every occurrence of the animation shorthand using this keyframe name
  const re = new RegExp(`animation:[^;}]*\\b${name}\\b`, 'g');
  let m: RegExpExecArray | null;
  let found = 0;
  while ((m = re.exec(css))) {
    found++;
    const before = css.slice(0, m.index);
    const openIdx = before.lastIndexOf(NO_PREF);
    if (openIdx === -1) return false; // no no-preference gate above this declaration
    // the gate must still be OPEN at the declaration: no block-closing `}` at column-0-ish
    // depth between the gate and here would be complex to track, so assert the gate is the
    // nearest media query above (a stricter media opener between them would mean a different block).
    const between = before.slice(openIdx + NO_PREF.length);
    const laterMedia = between.lastIndexOf('@media');
    if (laterMedia !== -1) return false; // a different @media intervenes → not this gate
  }
  return found > 0;
}

describe('cinematic hero motion — locked against silent regression', () => {
  it('the hero <img> carries the Ken-Burns class', () => {
    // HeroSplit's eager LCP image (object-cover) must keep `hero-kenburns`.
    expect(HERO).toMatch(/<img[\s\S]{0,400}hero-kenburns/);
  });

  it('all three cinematic hero keyframes exist with a real transform', () => {
    for (const name of ['hero-kenburns', 'hero-aurora-drift', 'hero-center-bloom']) {
      const kf = new RegExp(`@keyframes ${name}\\s*\\{[\\s\\S]*?\\}`).exec(CSS);
      expect(kf, `@keyframes ${name} must be defined`).not.toBeNull();
      expect(kf![0], `${name} must animate a transform`).toMatch(/transform:/);
    }
    // Ken-Burns is specifically a scale (never a flat pan-only that could clip oddly).
    expect(new RegExp('@keyframes hero-kenburns[\\s\\S]*?scale\\(').test(CSS)).toBe(true);
  });

  it('EVERY hero-motion animation is reduced-motion-gated (static base for reduced-motion / no-JS)', () => {
    for (const name of ['hero-kenburns', 'hero-aurora-drift', 'hero-center-bloom']) {
      expect(
        animationIsReducedMotionGated(CSS, name),
        `${name} animation must live inside @media (prefers-reduced-motion: no-preference)`,
      ).toBe(true);
    }
  });
});
