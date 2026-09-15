# Cinematic 3D — the immersive-homepage roadmap

> Executable spec for the **CINEMATIC-3D loop** (cron `840b9800`, every 2h). Goal: every generated
> homepage feels like the best motion.so / Motion-Flow-AI / Framer / Spline / Awwwards / Basement-Studio
> work — an HBO-level, immersive, scroll-driven experience — while staying **LCP≤2.0s, INP≤200ms,
> CLS≤0.05, axe-clean, reduced-motion-safe, and embarrassingly easy** (the owner never configures it).
>
> Grounded in the 2026 3D-web toolchain (Spline · React Three Fiber + Drei + Rapier · GSAP ScrollTrigger ·
> Lenis · Rive · Lottie · Three.js). Production sites LAYER these — each has one job. Heavy libs are
> LAZY-loaded; the LCP element is NEVER a late-decoding video/canvas (per `ttfr-north-star`).

## Non-negotiable constraints (every phase must hold these)

- **LCP≤2.0s** — the hero LCP element stays a transform-only styled block or a `fetchpriority=high` `<img>`. WebGL/R3F/Spline/video mount POST-hydration and fade in BEHIND the LCP element; they never become the LCP candidate.
- **Lazy-load every heavy lib** — `three` / `@react-three/fiber` / `@react-three/drei` / `gsap` / `lenis` / `@rive-app/*` / `lottie-web` live behind `@defer`-equivalent dynamic `import()` inside a post-hydration effect. NEVER an eager top-level import. Total added initial JS ≈ 0.
- **Reduced-motion** — `prefers-reduced-motion: reduce` → a static-but-gorgeous frame (no autoplay motion, no intro teaser, no parallax). The resting state is always fully legible.
- **No-WebGL / low-power fallback** — a brand-gradient hero when WebGL is unavailable or the device is low-power (respect `navigator.hardwareConcurrency` / `deviceMemory`).
- **INP≤200ms / CLS≤0.05** — all motion is transform/opacity only; scroll work is off the main thread (`ScrollTimeline` / passive listeners / RAF-throttled). No layout thrash.
- **0 console errors · axe-clean · Skip control** — every immersive layer is decorative (`aria-hidden`) and skippable; content is never gated behind an animation.
- **Embarrassingly easy** — the owner gets all of this with ZERO configuration; the pipeline picks the scene from `brand.themeStyle`. No knobs. (per `embarrassingly-easy-to-use`.)

## Where we are (shipped)

- **`WebGLHeroBackdrop`** — 14 hand-GLSL scenes (aurora/waves/mesh/ember/grid/bokeh/petals/smoke/terrain/silk/constellation/monolith/weave/velocity), auto-derived from `brand.themeStyle` via `backdropForPreset`, LCP-safe, reduced-motion + no-WebGL static fallback. Render-gated by `scripts/verify-hero-shader.mjs`.
- `.reveal-on-view` scroll reveals; `AnimatedSection`; per-industry theme presets.

## The roadmap (Loop 1 ships ONE increment per fire, in order)

1. **Pointer + scroll parallax depth** — feed `uMouse` + `uScroll` uniforms into `WebGLHeroBackdrop` (RAF-throttled, passive, reduced-motion-gated) so the field has living 3D depth that responds to the visitor. Zero new deps. Probe: canvas reacts to synthesized pointer/scroll, LCP unchanged.
2. **Lenis smooth-scroll + GSAP ScrollTrigger narrative** — lazy-loaded; a scroll-driven story where sections rise/settle with cinematic choreography (Stripe-homepage feel). Gate on reduced-motion; native scroll fallback. Probe: sections reveal on scroll, INP≤200ms.
3. **Skippable cinematic intro teaser (~2-3s, session-once)** — a brief branded title sequence on FIRST load only (per-session flag), with a persistent **Skip**, honoring reduced-motion (skipped entirely). Never blocks the LCP hero (overlays above, dismisses to it). Probe: teaser shows once, Skip works, LCP element still paints ≤2.0s.
4. **R3F / Spline per-industry 3D scenes** — upgrade the flagship verticals (jeweler → refractive gem, gallery → floating framed plane, outdoor → parallax terrain) to real 3D via lazy R3F + Drei (or a Spline export), reusing the `themeStyle → scene` map. Rapier physics for 2D-content-in-3D depth where it lands. Probe: 3D scene mounts post-hydration, static fallback verified.
5. **Rive / Lottie micro-interactions** — state-machine logo reveal, animated section icons, hover/scroll-reactive accents (lightweight runtime, lazy). Probe: interaction fires, no CLS.
6. **Grain + glass + light** — filmic grain overlay, glassmorphism section cards, volumetric light sweeps — the "premium finish" layer. Pure CSS/canvas, reduced-motion-safe.

## Layering (which tool for which job)

- **GSAP ScrollTrigger** — scroll-driven choreography / timelines.
- **Lenis** — the smooth "premium scroll" feel.
- **Three.js via R3F (+ Drei, + Rapier)** — bespoke 3D scenes + 2D-content-in-3D depth.
- **Spline** — designer-exported 3D scenes when hand-GLSL/R3F is overkill.
- **Rive** — state-machine interactive vector (logo, icons, onboarding).
- **Lottie (dotLottie)** — pre-baked timeline playback.
- **Hand-GLSL `WebGLHeroBackdrop`** — the always-on, zero-dep, per-industry ambient field (the base layer everything else composes over).

## Each fire's contract

Ship ONE roadmap increment → prove it in a real browser on a rebuilt site (screenshot + vision-inspect + CWV) → durable probe under `e2e/site-quality/` (auto-joins `run-all`) → land in the template repo (next build, NO redeploy). Measurably more beautiful AND still embarrassingly easy, every time.
