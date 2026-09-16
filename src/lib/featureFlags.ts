/**
 * Template-level experimental feature gates.
 *
 * A generated site is a STATIC R2 bundle — there is no runtime flag service (that's the admin/
 * platform D1 system), so a template feature dark-launches via a build-time default here. Promote
 * a feature by flipping its default to `true` (or by having site-gen inject `VITE_*` at build).
 * The `VITE_*` env override lets a local preview / E2E enable a still-dark feature WITHOUT changing
 * the shipped default — so the feature can be proven live before it's promoted for the fleet.
 */

/**
 * Smart Welcome Ribbon (`personalized_ribbon`) — zero-config visitor-adaptive greeting. Dark by
 * default (experimental); opt a build in with `VITE_PERSONALIZED_RIBBON=1`.
 */
export function personalizedRibbonEnabled(): boolean {
  return import.meta.env.VITE_PERSONALIZED_RIBBON === '1';
}

/**
 * Clip-path scroll reveal (`clip_reveal`) — the Awwwards/Zentry-signature "clip-path shaped
 * transition": a below-fold section visual wipes open (a cinematic letterbox reveal) as it scrolls
 * into view, driven by native `animation-timeline: view()` (compositor → INP-safe; below-fold →
 * LCP-safe; clip-path only → CLS-safe). Dark by default (experimental); opt a build in with
 * `VITE_CLIP_REVEAL=1`. Firefox / reduced-motion get the static, fully-visible image (never clipped).
 */
export function clipRevealEnabled(): boolean {
  return import.meta.env.VITE_CLIP_REVEAL === '1';
}

/**
 * Kinetic text-scramble (`text_scramble`) — the Awwwards SOTD tier-1 micro-interaction: a headline /
 * eyebrow "decodes" left-to-right (cycling glyphs → real text) on first view AND on hover, so a
 * live label that reacts to attention reads as premium in a way flat text never does. Dark by
 * default (experimental); opt a build in with `VITE_TEXT_SCRAMBLE=1`. Applied only to the MONO
 * eyebrow (fixed-width glyphs → zero width jitter → CLS-safe; not the LCP element → LCP-safe;
 * single ~620ms rAF → INP-safe). Reduced-motion / no-JS / flag-off → the plain static real text.
 * Source: awwwards.com scramble-text inspiration + Codrops 2026 kinetic-type trend.
 */
export function textScrambleEnabled(): boolean {
  return import.meta.env.VITE_TEXT_SCRAMBLE === '1';
}
