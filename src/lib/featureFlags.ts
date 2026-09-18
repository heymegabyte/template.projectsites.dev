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

/**
 * Exit-Intent Recovery (`exit_intent`) — the 2026 conversion frontier that is explicitly NOT native
 * to Framer / Lovable / v0 (it's "an architectural approach layered on, not a one-click feature").
 * When a desktop visitor's cursor darts to the top of the viewport to leave (the classic exit
 * signal), a tasteful, session-once card offers the ONE highest-intent action for THIS business —
 * derived automatically from its own content (click-to-call its phone, else jump to contact). The
 * owner configures NOTHING (embarrassingly-easy + ai-permanence). Dark by default (experimental);
 * opt a build in with `VITE_EXIT_INTENT=1`. LCP-safe (renders nothing until the exit signal, long
 * after paint), zero bundle (no lazy libs), reduced-motion-safe (CSS-gated entrance), axe-clean.
 * Source: elementor.com/blog/ai-landing + edesigninteractive.com 2026 conversion-trends (exit-intent
 * micro-behavior adaptation) — the named bleeding-edge the big AI builders don't ship.
 */
export function exitIntentEnabled(): boolean {
  return import.meta.env.VITE_EXIT_INTENT === '1';
}

/**
 * Scroll-driven 3D depth-cascade (`scroll_cinema` / VITE_SCROLL_CINEMA) — the motion.so / Awwwards
 * "content emerges from depth" signature. A below-fold group's items don't just fade+rise flat
 * (the existing `.reveal-on-view`); they CASCADE forward out of Z-depth — each item enters with a
 * subtle `rotateX` + `translateZ` (parent `perspective`) staggered per position, so the section
 * reads as a layered 3D scene assembling itself, not a flat list sliding up. Dark by default
 * (experimental); opt a build in with `VITE_SCROLL_CINEMA=1`.
 *
 * Safe BY CONSTRUCTION — pure native `animation-timeline: view()`, ZERO JS / no scroll listener
 * (unlike GSAP/Lenis): LCP-safe (below-fold + the keyframe's settled frame is identity, and it
 * NEVER wraps the hero LCP element), INP-safe (compositor-driven, off the main thread), CLS-safe
 * (transform + opacity only, opacity floored at 0.9 so text holds AA at every frame). Firefox
 * (no `animation-timeline`) + `prefers-reduced-motion: reduce` fall through both gates → items are
 * perfectly STATIC + fully visible. Source: motion.so / Awwwards SOTD 3D-scroll showcases +
 * Codrops 2026 scroll-depth trend — the cinematic layer the one-click AI builders don't ship.
 */
export function scrollCinemaEnabled(): boolean {
  return import.meta.env.VITE_SCROLL_CINEMA === '1';
}

/**
 * Ambient particle field (`particle_field` / VITE_PARTICLE_FIELD) — the Awwwards / motion.so
 * "living canvas" ambient signature: a slow drift of luminous brand-tinted motes behind the
 * closing CTA band, giving the section depth + life a flat gradient can't. Canvas 2D (NO WebGL,
 * NO library, ~2KB, a pre-rendered glow sprite `drawImage`d per mote), scoped INSIDE the
 * below-fold CTA container (visible over its gradient, behind its `z-10` text). Dark by default
 * (experimental); opt a build in with `VITE_PARTICLE_FIELD=1`.
 *
 * Safe BY CONSTRUCTION: LCP-safe (below-fold + the canvas MOUNTS only after an idle callback,
 * long after first paint, and is a decorative aria-hidden layer, NEVER the LCP element);
 * INP-safe (one lightweight rAF, ≤64 sprite blits, PAUSED on tab-hidden + when scrolled
 * off-screen via IntersectionObserver, passive pointer parallax reads a ref); CLS-safe
 * (absolute inset-0, zero layout). `prefers-reduced-motion: reduce` / no-canvas / no-JS /
 * flag-off → renders `null` (the section's existing gradient + aurora glows stand — still gorgeous).
 * Source: Awwwards SOTD ambient-canvas showcases + Codrops 2026 particle-field trend — the living
 * backdrop the one-click AI builders don't ship.
 */
export function particleFieldEnabled(): boolean {
  return import.meta.env.VITE_PARTICLE_FIELD === '1';
}

/**
 * Cinematic process reel (`cinematic_process` / VITE_CINEMATIC_PROCESS) — the Apple / Awwwards /
 * motion.so PINNED scrollytelling signature: the "How it works" step sequence becomes a pinned,
 * scroll-scrubbed reel where a sticky stage holds each step "act" and cross-dissolves them one at a
 * time as the visitor scrolls, a progress rail drawing through the whole chapter. Same PROCESS_*
 * content as the static {@link ProcessSteps} (a step sequence IS the natural scrollytelling), so it
 * auto-populates with zero new config. Dark by default (experimental); opt a build in with
 * `VITE_CINEMATIC_PROCESS=1`. When ON, `Home` renders {@link CinematicProcess} in place of
 * {@link ProcessSteps}; when OFF a shipped site is byte-for-byte unchanged.
 *
 * Safe BY CONSTRUCTION — pure native CSS `view-timeline` + `animation-timeline: view()`, ZERO JS /
 * no scroll listener (the component renders static markup): LCP-safe (below-fold; opacity/transform
 * only; never the hero LCP element), INP-safe (compositor-driven, off the main thread), CLS-safe
 * (the sticky stage reserves 100svh; acts are absolutely positioned within). The pin engages ONLY
 * inside `@supports (animation-timeline: view())` + `@media (min-width:768px) and
 * (prefers-reduced-motion:no-preference)` — Firefox / reduced-motion / mobile / no-JS fall through
 * to a fully-visible, legible static vertical stack of every step. Source: Apple product-page +
 * Awwwards SOTD pinned-scrollytelling showcases — the cinematic chapter the one-click AI builders
 * don't ship.
 */
export function cinematicProcessEnabled(): boolean {
  return import.meta.env.VITE_CINEMATIC_PROCESS === '1';
}
