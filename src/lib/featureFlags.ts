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
 * reads as a layered 3D scene assembling itself, not a flat list sliding up. **PROMOTED to
 * default-ON (CINEMATIC-3D)** — its safety profile is IDENTICAL to the always-on `.reveal-on-view`
 * (both native scroll-driven with the same static-visible fallback), so keeping it dark was the
 * built-but-unwired anti-pattern; `VITE_SCROLL_CINEMA=0` is the killswitch.
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
  return import.meta.env.VITE_SCROLL_CINEMA !== '0';
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

/**
 * Native height-auto FAQ disclosure (`faq_native_disclosure` / VITE_FAQ_NATIVE_DISCLOSURE) — the
 * 2026 "last unsolvable CSS transition, solved": `interpolate-size: allow-keywords` lets the answer
 * panel tween `height: 0 → auto` DIRECTLY (impossible before Chrome 129), retiring the `grid-rows
 * 0fr↔1fr` clip-workaround for the natural, content-honest reveal an owner's visitor feels as
 * premium. The reveal is driven ENTIRELY by CSS off the existing `[data-faq-open]` state + a single
 * `data-faq-native` opt-in attribute on the panel — ZERO new JS, no listener, no measurement.
 * Dark by default (experimental); opt a build in with `VITE_FAQ_NATIVE_DISCLOSURE=1`.
 *
 * Safe BY CONSTRUCTION — layered strictly UNDER `@supports (interpolate-size: allow-keywords)`, so
 * the always-present `grid-rows` reveal remains the universal base/fallback: flag-off OR an
 * unsupported browser (Firefox/Safari) renders byte-identically to today. LCP-safe (a below-fold
 * panel, collapsed at height 0, NEVER the hero LCP element); INP-safe (the height tween fires only
 * on a discrete click, one-shot — no continuous/scroll work, no main-thread listener); CLS-safe
 * (the panel is the only thing that resizes, expected on user intent). `prefers-reduced-motion:
 * reduce` / `prefers-reduced-data: reduce` → the existing FAQ resets clamp it to an INSTANT
 * open/close, fully operable. Source: developer.chrome.com/docs/css-ui/animate-to-height-auto +
 * web.dev CSS-2026 `interpolate-size`/`calc-size()` — the native primitive the one-click AI builders
 * (Framer / v0 / Lovable) still emulate with JS.
 */
export function faqNativeDisclosureEnabled(): boolean {
  return import.meta.env.VITE_FAQ_NATIVE_DISCLOSURE === '1';
}

/**
 * Kinetic velocity marquee (`kinetic_marquee` / VITE_KINETIC_MARQUEE) — the Framer / Awwwards
 * "velocity marquee" signature: a perspective-tilted typographic ribbon of the business's OWN
 * offering words (feature / service titles) that drifts continuously (alive at rest) AND couples to
 * scroll so the words visibly rush as the visitor moves, set on a subtle `rotateX` receding plane so
 * it reads as a cinematic 3D depth band rather than a flat ticker. Same feature titles the Bento
 * section already renders, so it auto-populates with zero new config (unfilled `{TOKEN}`s are
 * dropped; <2 real words → renders nothing). Dark by default (experimental); opt a build in with
 * `VITE_KINETIC_MARQUEE=1`. When ON, `Home` renders {@link KineticMarquee} as a band between the
 * services and collection sections; when OFF a shipped site is byte-for-byte unchanged.
 *
 * Safe BY CONSTRUCTION — pure native CSS (NO library, NO JS scroll listener, unlike GSAP/Lenis): the
 * continuous drift is a universally-supported keyframe; the scroll coupling lives inside
 * `@supports (animation-timeline: scroll())` + `@media (prefers-reduced-motion: no-preference)`.
 * LCP-safe (a BELOW-fold `aria-hidden` decorative band, never the hero LCP element; drift starts at
 * identity, scroll nudge is ±4%), INP-safe (`animation-timeline: scroll(root)` is compositor-driven,
 * off the main thread), CLS-safe (transform-only inside `overflow:hidden`). Firefox keeps the drift
 * without scroll coupling; `prefers-reduced-motion: reduce` → the ribbon is perfectly STATIC + fully
 * legible. Source: Framer velocity-marquee + Awwwards SOTD ribbon-band showcases — the kinetic layer
 * the one-click AI builders (Framer / v0 / Lovable) don't ship as one-click.
 */
export function kineticMarqueeEnabled(): boolean {
  return import.meta.env.VITE_KINETIC_MARQUEE === '1';
}

/**
 * Scroll-stacking cards (`scroll_stack` / VITE_SCROLL_STACK) — the Apple / Awwwards "cards stack &
 * recede as you scroll" signature: the "How it works" steps become a VERTICAL DECK where each step
 * pins near the top and gently scales back as the next slides over it, so the section reads as a
 * guided, one-step-at-a-time narrative instead of a flat grid. Same PROCESS_* content the static
 * {@link ProcessSteps} renders (a step sequence IS the natural scroll-stack), zero new config. Dark
 * by default (experimental); opt a build in with `VITE_SCROLL_STACK=1`. When ON (and
 * `cinematic_process` is OFF), `Home` renders `<ProcessSteps stack>`; when OFF a shipped site is
 * byte-for-byte unchanged.
 *
 * Safe BY CONSTRUCTION — pure native CSS `position: sticky` + `animation-timeline: view()`, ZERO JS /
 * no scroll listener (unlike GSAP/Lenis): LCP-safe (below-fold; the settled/first frame is identity
 * scale 1; NEVER the hero LCP element), INP-safe (compositor-driven, off the main thread), CLS-safe
 * (transform-only). The sticky pin + view()-scrubbed recede live INSIDE `@supports (animation-timeline:
 * view())` + `@media (min-width:768px) and (prefers-reduced-motion:no-preference)` — Firefox /
 * reduced-motion / mobile fall through to a plain, fully-visible vertical card list (never a
 * stuck-scaled card). Source: Apple product-page + Awwwards SOTD scroll-stack showcases — the deck
 * the one-click AI builders don't ship.
 */
export function scrollStackEnabled(): boolean {
  return import.meta.env.VITE_SCROLL_STACK === '1';
}
