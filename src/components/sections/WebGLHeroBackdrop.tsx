import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * WebGLHeroBackdrop — a gorgeous, brand-tinted animated hero backdrop rendered
 * with a hand-written GLSL fragment shader on a raw `<canvas>` (NO three.js).
 *
 * WHY RAW WEBGL, NOT three.js / R3F:
 * three.js + R3F is ~150 KB gzip — it blows this template's TTFR / JS-budget gate
 * and hurts LCP for the low-bandwidth audiences these sites serve. A single
 * fragment shader gives the same "wow" (flowing aurora / mesh) at ~3 KB with zero
 * dependencies. If a build ever needs true 3D geometry, lazy-load R3F in a
 * `@defer`-style dynamic import behind these same guards — never in the initial bundle.
 *
 * LCP-SAFE BY CONSTRUCTION:
 *   - It is a DECORATIVE backdrop (`aria-hidden`, `pointer-events-none`), absolutely
 *     positioned BEHIND the hero content. The hero's H1/text is the LCP element and
 *     paints immediately, independent of this canvas.
 *   - The WebGL context + RAF loop start AFTER mount (post-hydration), so they never
 *     block first paint. Animation pauses when the tab/section isn't visible.
 *
 * GRACEFUL DEGRADATION (always legible):
 *   - `prefers-reduced-motion: reduce` → NO canvas, NO RAF; a static brand gradient.
 *   - WebGL unavailable / context lost → the same static brand gradient.
 *
 * BRAND-TINTED AUTOMATICALLY: reads `--brand-hue` from the cascade and feeds it to
 * the shader, so the backdrop matches whatever palette the generated site uses.
 */

/** The visual character of the backdrop — pick per industry. */
export type HeroBackdropVariant =
  | 'aurora'
  | 'waves'
  | 'mesh'
  | 'ember'
  | 'grid'
  | 'bokeh'
  | 'petals'
  | 'smoke'
  | 'terrain'
  | 'silk'
  | 'constellation'
  | 'monolith'
  | 'weave';

/** Shader parameters per variant (pure data — unit-tested). */
export interface HeroBackdropConfig {
  /** Spatial frequency of the noise field (higher = finer detail). */
  scale: number;
  /** Animation speed multiplier. */
  speed: number;
  /** Band contrast (higher = sharper light ribbons). */
  sharpness: number;
  /** Hue spread around the brand hue, in turns (0..1). */
  hueSpread: number;
  /** Overall brightness (0..1). Kept low so foreground text stays legible. */
  intensity: number;
  /**
   * Domain-warp strength — flows the noise sample coords through a low-freq fbm field so the
   * flat noise becomes marbled, swirling ribbons (organic + premium, +~20% structural variance).
   * `0` = the legacy flat field (identical to the pre-warp shader). Tuned per variant.
   */
  warp: number;
}

/**
 * Per-variant shader configs. `aurora` = soft flowing ribbons (wellness/creative);
 * `waves` = broad horizontal swells (finance/professional, calmer); `mesh` = tighter
 * cellular shimmer (tech/AI); `ember` = a warm glow that RISES from a hearth floor
 * (food/hospitality/artisan — vertical, not diagonal, motion); `grid` = a neon
 * perspective floor receding to a horizon sun-glow (retro/synthwave — the iconic
 * scrolling-toward-you grid, distinct from every noise-field variant).
 * `bokeh` = soft out-of-focus light discs drifting slowly upward, a refined "dust motes in a
 * sunbeam" field (luxe — fine dining / jewelry / hotels; a distinct premium scene, not the shared
 * `waves`). `petals` = soft brand-tinted blossoms drifting DOWNWARD with gentle sway + rotation, a
 * botanical "falling petals" field (florist / plant shop / garden / nursery — its OWN organic scene,
 * not the shared `aurora` ribbons). `smoke` = cool, dark, near-monochrome wispy haze rising slowly, a
 * moody after-dark field (noir — tattoo / speakeasy / cocktail lounge / nightclub / jazz; its OWN
 * edgy scene, not ember's WARM food-hospitality glow). All stay dark + low-intensity so foreground
 * text stays legible.
 */
export const HERO_BACKDROP_CONFIGS: Record<HeroBackdropVariant, HeroBackdropConfig> = {
  // warp: aurora highest (flowing ribbons), ember turbulent, waves silky-gentle, mesh subtle
  // (keep the tight cellular tech read — just less flat). grid + bokeh ignore warp (no fbm field)
  // but carry a small positive value for config uniformity; grid scale=density/sharp=line crispness,
  // bokeh scale/sharp unused (disc radii are baked) — intensity + hueSpread DO drive bokeh.
  aurora: { scale: 2.5, speed: 1.0, sharpness: 0.7, hueSpread: 0.08, intensity: 0.9, warp: 0.9 },
  waves: { scale: 1.6, speed: 0.6, sharpness: 0.5, hueSpread: 0.04, intensity: 0.8, warp: 0.5 },
  mesh: { scale: 4.0, speed: 1.3, sharpness: 0.85, hueSpread: 0.12, intensity: 0.85, warp: 0.35 },
  ember: { scale: 2.0, speed: 0.8, sharpness: 0.58, hueSpread: 0.06, intensity: 0.82, warp: 0.7 },
  grid: { scale: 7.0, speed: 1.0, sharpness: 0.7, hueSpread: 0.05, intensity: 0.8, warp: 0.3 },
  // bokeh: slow drift (premium restraint), gentle hue variation across discs, low intensity so the
  // soft glows never compete with the hero H1. scale/sharpness/warp are inert for this mode.
  bokeh: { scale: 1.0, speed: 0.4, sharpness: 0.5, hueSpread: 0.1, intensity: 0.8, warp: 0.3 },
  // petals: falling blossoms — slow downward drift + rotation, wider hueSpread for floral color
  // variation, low intensity so the soft shapes never compete with the H1. scale/sharpness/warp inert.
  petals: { scale: 1.0, speed: 0.45, sharpness: 0.5, hueSpread: 0.14, intensity: 0.82, warp: 0.3 },
  // smoke: cool dark wispy haze for NOIR — near-monochrome (low hueSpread), low intensity so the
  // moody field never competes with the H1. scale drives the fbm frequency; sharpness/warp inert.
  smoke: { scale: 2.2, speed: 0.5, sharpness: 0.6, hueSpread: 0.05, intensity: 0.7, warp: 0.4 },
  // terrain: slowly-morphing topographic contour rings for RUGGED (outdoor/adventure/trades). scale
  // = contour density, sharpness = line crispness, low hueSpread = earthy consistency; warp inert.
  terrain: { scale: 2.8, speed: 0.6, sharpness: 0.72, hueSpread: 0.06, intensity: 0.8, warp: 0.4 },
  // silk: draped-satin folds with a slow sweeping specular sheen for BOUTIQUE (upscale fashion /
  // jewelry / salon). scale = fold frequency, sharpness = sheen tightness, low hueSpread = elegant
  // restraint; warp curves the folds. Distinct from aurora's ribbons: horizontal folds + a moving
  // highlight band, like light gliding across draped fabric.
  silk: { scale: 2.0, speed: 0.5, sharpness: 0.62, hueSpread: 0.07, intensity: 0.82, warp: 0.5 },
  // constellation: a deep-night star map — tiny sharp TWINKLING star points (with faint cross
  // sparkles) for SCHOLARLY (academic/library/education/research). hueSpread varies star color,
  // low intensity keeps it behind the H1; scale/sharpness/warp inert (points are procedural).
  constellation: { scale: 1.0, speed: 0.4, sharpness: 0.6, hueSpread: 0.1, intensity: 0.8, warp: 0.3 },
  // monolith: stark hard-edged concrete SLABS for BRUTALIST (bold agencies / design studios /
  // architecture / edgy brands). scale = slab count, sharpness = edge crispness, near-zero hueSpread
  // = raw-concrete monochrome (only the single fault seam carries brand hue); warp inert. Distinct
  // from mesh's soft cellular shimmer: quantized blocks with dark mortar grooves + one glowing seam.
  monolith: { scale: 5.0, speed: 0.5, sharpness: 0.8, hueSpread: 0.04, intensity: 0.78, warp: 0.2 },
  // weave: a warm interlaced warp/weft thread LATTICE for ARTISAN (coffee roaster / pottery /
  // woodwork / leather / candle / chocolatier / distillery). scale = weave density, sharpness =
  // thread crispness, low hueSpread = a subtle warm two-tone; warp inert (procedural lattice).
  // Distinct from ember's diffuse rising glow: structured over/under woven threads (handcraft).
  weave: { scale: 5.5, speed: 0.5, sharpness: 0.6, hueSpread: 0.06, intensity: 0.8, warp: 0.3 },
};

/**
 * Map a `themeStyle` preset (the 13 site personalities) to the backdrop whose
 * MOTION matches that personality — so every generated site gets a fitting
 * animated hero automatically (no per-build opt-in):
 *   - `aurora` — soft flowing ribbons → welcoming / organic / creative
 *     (classic — the generic soft-ribbon default);
 *   - `constellation` — tiny twinkling star points (a knowledge map) → academic / scholarly / research
 *     (scholarly — a library / university / research org wants a deep-night star chart, not generic ribbons);
 *   - `silk`   — draped-satin folds with a sweeping specular sheen → premium / elegant / refined
 *     (boutique — upscale fashion / jewelry / salon want a lustrous draped-fabric shimmer, not the
 *      soft aurora ribbons they used to share);
 *   - `petals` — soft blossoms drifting downward → botanical / floral / garden
 *     (botanical — florist / plant shop / nursery get their OWN falling-petals scene, not shared aurora);
 *   - `waves`  — broad calm swells → authoritative / professional / trusted / dignified
 *     (editorial, heritage — a law / accounting / insurance / real-estate firm reads as steady +
 *      trusted, NOT cozy-warm; ember's hearth glow was a mismatch for it);
 *   - `bokeh`  — soft drifting out-of-focus light-motes → refined / premium / elegant
 *     (luxe — fine dining / jewelry / hotels want their OWN premium field, not editorial's waves);
 *   - `mesh`   — tight cellular shimmer → technical / energetic / precise
 *     (futuristic, bold, precision, brutalist);
 *   - `terrain`— slowly-morphing topographic contour rings → outdoor / rugged / earthy
 *     (rugged — outdoor gear / adventure / landscaping / construction / trades want an earthy
 *      "living elevation map", NOT the tech cellular mesh they used to share);
 *   - `ember`  — warm glow rising from a hearth floor → food / hospitality / artisan
 *     (warm, artisan — an intimate warm-glow-in-a-dark-room for a bakery/roastery/steakhouse);
 *   - `smoke`  — cool dark wispy haze rising slowly → after-dark / edgy / moody
 *     (noir — a tattoo studio / speakeasy / cocktail lounge / nightclub / jazz bar wants a smoky,
 *      near-monochrome haze, NOT ember's cozy WARM food-hospitality glow);
 *   - `grid`   — neon perspective floor scrolling to a horizon sun-glow → retro / synthwave
 *     (retro — the iconic scrolling grid IS the retro identity; a soft aurora field undersold it).
 * Pure + total (unknown/blank → `aurora`) so it unit-tests in isolation.
 *
 * @example backdropForPreset('luxe')       // → 'bokeh'
 * @example backdropForPreset('botanical')  // → 'petals'
 * @example backdropForPreset('noir')       // → 'smoke'
 * @example backdropForPreset('heritage')   // → 'waves'
 * @example backdropForPreset('futuristic') // → 'mesh'
 * @example backdropForPreset('warm')       // → 'ember'
 * @example backdropForPreset('retro')      // → 'grid'
 * @example backdropForPreset(undefined)    // → 'aurora'
 */
// MUST carry an explicit entry for EVERY `THEME_PRESETS` key — a preset with no entry
// silently falls back to `aurora` below, so a tech/energetic personality (e.g. `precision`,
// `bold`) would ship SOFT ribbons instead of the intended `mesh` shimmer: a per-industry
// beauty regression that's invisible (no error). Presets get added often (5 in recent
// commits), so the coverage is drift-GUARDED by a test (WebGLHeroBackdrop.test.ts asserts
// every PRESET_NAMES entry is a key here) — add the mapping in the SAME change as a new preset.
export const PRESET_BACKDROP: Record<string, HeroBackdropVariant> = {
  botanical: 'petals', // falling blossoms — florist/plant/garden get their OWN organic scene, not shared aurora ribbons (AL-511)
  classic: 'aurora',
  scholarly: 'constellation', // AL-532: academic/library/education/research get a deep-night star map (twinkling knowledge points), not the generic soft-ribbon aurora

  boutique: 'silk', // AL-525: upscale fashion/jewelry/salon get draped-satin folds with a sweeping sheen — a soft aurora ribbon undersold the premium boutique feel
  editorial: 'waves',
  heritage: 'waves', // dignified authoritative swells — financial/legal/insurance/real-estate; ember's cozy hearth glow was a MISMATCH for a law/accounting/insurance firm (AL-490)
  luxe: 'bokeh', // premium drifting light-motes — luxe's OWN refined scene, not editorial's waves
  futuristic: 'mesh', bold: 'mesh', precision: 'mesh',
  brutalist: 'monolith', // AL-538: raw stark concrete SLABS + one glowing fault seam — the soft cellular tech MESH was a mismatch for brutalist's hard-edged architectural identity
  rugged: 'terrain', // AL-521: outdoor/adventure/landscaping/trades get earthy topographic contour rings — a tech cellular MESH was a mismatch for the rugged outdoors
  warm: 'ember',
  artisan: 'weave', // AL-548: craft/maker (roaster/pottery/woodwork/leather/candle/chocolatier) get an interlaced woven-thread lattice — ember's diffuse food-hearth glow was a mismatch for handcraft's tactile, made-by-hand character
  noir: 'smoke', // AL-517: after-dark venues (tattoo/speakeasy/cocktail/nightclub/jazz) get a cool wispy SMOKE haze, not the WARM food-hospitality ember glow — motivated by the seven-swords-tattoo delivery
  retro: 'grid', // synthwave neon perspective grid — retro's iconic aesthetic, not a soft ribbon field
};
export function backdropForPreset(preset: string | null | undefined): HeroBackdropVariant {
  return PRESET_BACKDROP[(preset ?? '').trim().toLowerCase()] ?? 'aurora';
}

/**
 * Parse a `--brand-hue` CSS value (degrees, 0–360) into a shader turn (0–1).
 * Falls back to 240 (the template default blue) for blank/NaN input.
 *
 * @example parseBrandHue('195') // → 195/360
 * @example parseBrandHue('')    // → 240/360
 */
export function parseBrandHue(cssValue: string | null | undefined, fallbackDeg = 240): number {
  const deg = Number.parseFloat((cssValue ?? '').trim());
  const h = Number.isFinite(deg) ? deg : fallbackDeg;
  return ((h % 360) + 360) % 360 / 360;
}

/**
 * Decide how to render: the animated WebGL scene only when motion is allowed AND WebGL is
 * available AND the page is NOT a light theme; otherwise the static brand gradient. Pure → unit-tested.
 *
 * WHY light themes get the static gradient (AL-448): the backdrop is a DARK-FIRST atmospheric
 * field, so on a LIGHT theme it paints a dark, muddy field that (a) looks off-theme and (b) drops
 * the LIGHT-theme (dark) hero eyebrow/subtitle/badge text to ~1.2:1 — dark-on-dark. axe is BLIND to
 * it (the field is a `<canvas>`, not a CSS background), so it shipped unflagged (Verve coffee, hue 45).
 * The static gradient is subtle + brand-tinted + keeps the light hero clean and the dark text legible.
 *
 * @example resolveBackdropMode({ reducedMotion: true,  webglOk: true,  lightTheme: false }) // 'static'
 * @example resolveBackdropMode({ reducedMotion: false, webglOk: false, lightTheme: false }) // 'static'
 * @example resolveBackdropMode({ reducedMotion: false, webglOk: true,  lightTheme: true  }) // 'static'
 * @example resolveBackdropMode({ reducedMotion: false, webglOk: true,  lightTheme: false }) // 'webgl'
 */
export function resolveBackdropMode(input: {
  reducedMotion: boolean;
  webglOk: boolean;
  lightTheme: boolean;
}): 'webgl' | 'static' {
  return !input.reducedMotion && input.webglOk && !input.lightTheme ? 'webgl' : 'static';
}

/**
 * Is the page currently rendering the LIGHT theme? Reads the resolved theme: an explicit
 * `data-theme` attribute wins; `auto`/unset falls back to the `prefers-color-scheme` media query.
 * SSR-safe (returns false without `document`).
 *
 * @example isLightTheme() // true when <html data-theme="light"> or (auto + OS light)
 */
export function isLightTheme(): boolean {
  if (typeof document === 'undefined') return false;
  const attr = (document.documentElement.getAttribute('data-theme') || '').toLowerCase();
  if (attr === 'light') return true;
  if (attr === 'dark') return false;
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches === true;
}

/**
 * A tiny inline SVG `feTurbulence` fractal-noise tile, as a `background-image` `url()`.
 * Rendered as a low-opacity, `mix-blend-soft-light` overlay on the STATIC fallback so that
 * light-theme / reduced-motion / no-WebGL / first-paint heroes get the SAME cinematic
 * "glass+grain" texture the animated WebGL path carries in-shader (see FILM-GRAIN DITHER):
 *   - it breaks up 8-bit gradient BANDING on the smooth radial fallback (an objective artifact
 *     of quantizing a slow ramp to 24-bit color), and
 *   - it adds a faint film-grain texture so the fallback reads premium, not flat.
 * STATIC (no animation) → reduced-motion-safe. Inline data URI → zero network, LCP-safe.
 * A large fraction of generated sites are LIGHT-theme (dark logo → light theme), and light
 * themes ALWAYS take this fallback (resolveBackdropMode), so this lifts most delivered heroes.
 */
export const GRAIN_DATA_URI = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const FRAG_SRC = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uHue;       // 0..1 (brand)
uniform float uScale;
uniform float uSharp;
uniform float uSpread;
uniform float uIntensity;
uniform float uMode;      // 0=flowing(aurora/waves/mesh) 1=ember 2=grid 3=bokeh 4=petals 5=smoke 6=terrain 7=silk 8=constellation 9=monolith 10=weave
uniform float uWarp;      // domain-warp strength (0 = legacy flat field)
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=0.5; } return v; }
vec3 hsl2rgb(float h,float s,float l){ vec3 r=clamp(abs(mod(h*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0); return l+s*(r-0.5)*(1.0-abs(2.0*l-1.0)); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = uv * vec2(uRes.x/uRes.y, 1.0);
  float t = uTime * 0.05;
  vec3 col;
  if (uMode > 9.5) {
    // ---- WEAVE (uMode==10): a warm interlaced warp/weft thread LATTICE — a handcraft/textile field
    // for ARTISAN (coffee roaster / pottery / woodwork / leather / candle / chocolatier / distillery).
    // Two thread sets (horizontal warp + vertical weft) interlace via an over/under CHECKER so the
    // field reads as WOVEN cloth, drifting slowly. Distinct from ember's diffuse rising glow: this is
    // structured, tactile, made-by-hand. Warm brand-hue two-tone; dark ground keeps the H1 legible.
    // uScale = weave density, uSharp = thread crispness.
    vec2 g = p * uScale + vec2(t * 0.05, t * 0.04);        // slow diagonal drift
    float warpT = abs(sin(g.y * 3.14159));                 // horizontal threads (ridge along y)
    float weftT = abs(sin(g.x * 3.14159));                 // vertical threads (ridge along x)
    vec2 cell = floor(g);
    float over = mod(cell.x + cell.y, 2.0);                // checker: which thread is ON TOP this cell
    float top = mix(warpT, weftT, over);                   // the over-thread shows crisply
    float under = mix(weftT, warpT, over) * 0.45;          // the under-thread sits dimmer
    float lattice = pow(max(top, under), mix(2.0, 5.0, uSharp)); // sharpen into distinct threads
    float hue = uHue - 0.02 + uSpread * (over - 0.5);      // warm two-tone weave (nudged warm like craft)
    col = hsl2rgb(hue, 0.5, 0.10 + 0.32 * lattice);        // warm woven threads on a dark ground
  } else if (uMode > 8.5) {
    // ---- MONOLITH (uMode==9): stark, hard-edged concrete SLABS shifting slowly — a raw BRUTALIST
    // field (bold agencies / design studios / architecture / edgy brands). Hard QUANTIZED blocks
    // (staggered brick bond, 4 stepped concrete greys, dark mortar grooves — no soft bloom) with a
    // single bright brand-hue SEAM glowing along one slowly-sweeping fault line. The opposite of
    // mesh's soft cellular shimmer. Near-monochrome + low intensity keep the center H1 legible.
    // uScale = slab count, uSharp unused here (edges are hard by construction).
    vec2 g = vec2(p.x * uScale, p.y * uScale * 0.7);          // slab grid (slightly tall blocks)
    float row = floor(g.y + t * 0.12);                        // which row (for the brick stagger), drifts slowly
    vec2 gr = vec2(g.x + 0.5 * mod(row, 2.0), g.y + t * 0.12);// staggered brick bond + slow downward drift
    vec2 cell = floor(gr);
    float tone = hash(cell);                                  // per-slab concrete tone
    float shade = 0.07 + 0.13 * floor(tone * 4.0) / 3.0;      // 4 HARD quantized concrete greys (no gradient)
    vec2 f = fract(gr);                                       // position within the slab
    float edge = smoothstep(0.0, 0.045, f.x) * smoothstep(0.0, 0.045, 1.0 - f.x)
               * smoothstep(0.0, 0.045, f.y) * smoothstep(0.0, 0.045, 1.0 - f.y); // dark mortar grooves between slabs
    float seamX = 0.5 + 0.30 * sin(t * 0.35);                 // one slowly-sweeping vertical fault line
    float seam = smoothstep(0.014, 0.0, abs(uv.x - seamX));   // thin hard glowing seam
    col = vec3(shade * mix(0.45, 1.0, edge)) + hsl2rgb(uHue, 0.85, 0.5) * seam * 0.5;
  } else if (uMode > 7.5) {
    // ---- CONSTELLATION (uMode==8): a deep-night STAR MAP — tiny sharp TWINKLING star points
    // (with faint 4-point cross sparkles) drifting slowly on a dark field, a "knowledge map" for
    // SCHOLARLY (academic / library / education / research). Distinct from bokeh's soft LARGE
    // discs: stars are tiny, sharp, and twinkle. Dark base + low intensity keep the H1 legible.
    col = vec3(0.0);
    for (int i = 0; i < 16; i++) {
      float fi = float(i);
      float sx = hash(vec2(fi, 1.3));
      float sy = hash(vec2(fi * 2.1, 7.7));
      vec2 pos = vec2(fract(sx + 0.012 * sin(t * 0.3 + fi)), fract(sy + 0.012 * cos(t * 0.25 + fi)));
      vec2 d = (uv - pos) * vec2(uRes.x / uRes.y, 1.0);
      float dist = length(d);
      float tw = 0.45 + 0.55 * sin(t * (1.4 + sx * 2.2) + fi * 1.7);      // per-star twinkle
      float core = (0.0011 + 0.0011 * tw) / (dist * dist + 0.00045);      // tiny sharp core + halo
      // faint 4-point sparkle spikes (thin cross) near the star so it reads as a STAR, not a dot
      float spike = 0.00030 * tw * (1.0 / (abs(d.x) * 42.0 + 0.35) + 1.0 / (abs(d.y) * 42.0 + 0.35)) * smoothstep(0.09, 0.0, dist);
      col += hsl2rgb(uHue + uSpread * (sx - 0.5), 0.55, 0.62) * (core + spike);
    }
  } else if (uMode > 6.5) {
    // ---- SILK (uMode==7): draped-satin folds with a slow SWEEPING SPECULAR SHEEN — a lustrous
    // premium field for BOUTIQUE (upscale fashion / jewelry / salon). A warped fbm field, sampled
    // stretched (folds run mostly horizontal like hanging fabric), lit by a sharp highlight band
    // that glides across the folds over time (light gliding on satin). Distinct from aurora's soft
    // ribbons: tighter directional folds + a moving specular crest. Dark base + low intensity keep
    // the center H1 legible. uScale = fold frequency, uSharp = sheen tightness.
    vec2 drift = vec2(0.05 * sin(t * 0.6), t * 0.18);
    vec2 q = vec2(fbm(p * uScale + drift), fbm(p * uScale + drift + 4.7));       // domain warp → curved folds
    float fold = fbm(vec2(p.x * uScale * 0.6, p.y * uScale * 1.8) + uWarp * q + drift); // stretched → horizontal folds
    float sheenBand = 0.5 + 0.5 * sin(fold * 6.2831 + p.x * 1.5 - t * 1.6);      // a highlight that sweeps the folds
    float sheen = pow(sheenBand, mix(6.0, 16.0, uSharp));                        // sharp satin crest (sharper preset = tighter)
    vec3 tint = hsl2rgb(uHue + uSpread * (fold - 0.5), 0.42, 0.14 + 0.10 * fold);
    col = tint + hsl2rgb(uHue, 0.25, 0.5) * 0.42 * sheen;                        // base drape + bright moving sheen
  } else if (uMode > 5.5) {
    // ---- TERRAIN (uMode==6): slowly-morphing topographic CONTOUR RINGS — an earthy "living
    // elevation map" for RUGGED (outdoor gear / adventure / landscaping / construction / trades).
    // Distinct from every other scene: thin bright brand-tinted contour rings on a dark earthy
    // field, breathing as the elevation fbm drifts. uScale = contour density, uSharp = line
    // crispness. The shared vignette + intensity below keep the center H1 legible.
    vec2 drift = vec2(0.015 * sin(t * 0.5), t * 0.12);        // slow elevation morph + gentle pan
    float e = fbm(p * uScale + drift);                        // elevation field 0..1
    float bands = 9.0;                                        // number of contour levels
    float g = fract(e * bands);                               // position within the current band
    float lw = mix(0.20, 0.06, uSharp);                       // contour line half-width (sharper = thinner)
    float line = (1.0 - smoothstep(0.0, lw, g)) + (1.0 - smoothstep(0.0, lw, 1.0 - g)); // ring at each band edge
    line = clamp(line, 0.0, 1.0);
    float relief = 0.10 * e;                                  // faint elevation fill for depth
    col = hsl2rgb(uHue + uSpread * (e - 0.5), 0.5, 0.12 + relief + 0.34 * line);
  } else if (uMode > 4.5) {
    // ---- SMOKE (uMode==5): cool, dark, slow-RISING wispy haze — a moody after-dark field for NOIR
    // (tattoo / speakeasy / cocktail lounge / nightclub / jazz). Distinct from ember's WARM hearth
    // glow: smoke is near-monochrome grey (a faint brand tint only in the densest wisps), the fbm
    // tendrils are sharp+wispy (not a soft bloom), and it rises slowly — haze in a dark room, not a
    // cozy fire. The shared vignette + intensity below keep the center H1 legible.
    vec2 drift = vec2(0.02 * sin(t * 0.9), -t * 0.7);   // slow upward rise (smoke rises) + gentle sway
    vec2 q = vec2(fbm(p * uScale + drift), fbm(p * uScale + drift + 3.3));
    float f = fbm(p * uScale + 1.1 * q + drift);
    float wisp = smoothstep(0.42, 0.86, f);             // sharp-ish tendrils = wispy smoke, not a glow
    vec3 grey = vec3(0.09 + 0.22 * wisp);               // cool near-monochrome haze
    vec3 tint = hsl2rgb(uHue + uSpread * (f - 0.5), 0.35, 0.15 + 0.13 * wisp);
    col = mix(grey, tint, 0.33 * wisp);                 // mostly grey, a whisper of brand color in the wisps
  } else if (uMode > 3.5) {
    // ---- PETALS (uMode==4): soft brand-tinted blossoms drifting DOWNWARD with a gentle lateral
    // sway + slow rotation — a botanical "falling petals" field for florist / plant / garden. The
    // downward motion (vs bokeh's upward rise) + the elongated, rotated soft shape read as petals,
    // not motes. Same dark base + low intensity so the center H1 stays legible on any brand hue.
    col = vec3(0.0);
    for (int i = 0; i < 10; i++) {
      float fi = float(i);
      float s1 = hash(vec2(fi, 5.3));
      float s2 = hash(vec2(fi * 1.7, 2.9));
      float cy = fract(1.0 - (s2 + t * (0.45 + 0.5 * s1)));       // fall DOWNWARD, wraps 1..0
      float cx = fract(s1 + 0.05 * sin(t * (0.7 + s2) + fi * 1.3)); // gentle lateral sway
      vec2 d = (uv - vec2(cx, cy)) * vec2(uRes.x / uRes.y, 1.0);
      float ang = t * (0.6 + s1) + fi;                            // slow rotation
      vec2 r = vec2(cos(ang) * d.x - sin(ang) * d.y, sin(ang) * d.x + cos(ang) * d.y);
      float rad = mix(0.05, 0.12, s1);
      float petal = smoothstep(rad, rad * 0.15, length(r * vec2(1.0, 2.2))); // 2.2× taller = petal
      col += hsl2rgb(uHue + uSpread * (s1 - 0.5), 0.55, 0.5) * petal * (0.08 + 0.08 * s2);
    }
  } else if (uMode > 2.5) {
    // ---- BOKEH (uMode==3): soft out-of-focus light discs drifting slowly upward — a refined
    // "dust motes in a sunbeam" field for luxe (fine dining / jewelry / hotels). Dark base; each
    // disc a soft brand-tinted radial glow; slow motion = understated premium. The shared vignette
    // + per-hue luma-comp + intensity below keep the center H1 legible on any brand hue.
    col = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      float s1 = hash(vec2(fi, 3.7));
      float s2 = hash(vec2(fi * 1.3, 9.1));
      float rad = mix(0.05, 0.16, s1);                          // varied depth-of-field disc radii
      float cy = fract(s2 - t * (0.6 + s1));                    // slow upward rise, wraps 0..1
      float cx = fract(s1 + 0.06 * sin(t * (0.8 + s2) + fi));   // gentle lateral sway
      float d = length((uv - vec2(cx, cy)) * vec2(uRes.x / uRes.y, 1.0));
      float disc = smoothstep(rad, rad * 0.2, d);               // soft-edged bokeh disc
      col += hsl2rgb(uHue + uSpread * (s1 - 0.5), 0.5, 0.5) * disc * (0.09 + 0.09 * s2);
    }
  } else if (uMode > 1.5) {
    // ---- SYNTHWAVE GRID (uMode==2): a neon perspective floor receding to a horizon sun-glow.
    // The iconic retro/synthwave scene — rows scroll TOWARD the viewer. Distinct from every
    // noise-field variant. The horizon sits LOW (bottom third) so the grid floor + neon sun
    // occupy the bottom, and the hero H1 (vertical center) rests in the calm DARK SKY above
    // them — text stays legible without the sun-glow competing behind the headline.
    float H = 0.40;                                    // horizon height in screen space (low → sky-dominant)
    if (uv.y < H) {
      float fade = (H - uv.y) / H;                     // 0 at horizon → 1 at bottom edge
      float persp = 1.0 / max(1.0 - fade, 0.04);       // depth explodes toward the horizon
      float gx = (uv.x - 0.5) * persp * uScale;        // perspective-widened columns (uScale = density)
      float gz = persp * 2.4 - t * 8.0;                // rows flow toward the viewer
      float lw = mix(0.06, 0.02, uSharp);              // line half-width (sharper preset = thinner)
      float lines = (1.0 - smoothstep(0.0, lw, abs(fract(gx) - 0.5)))
                  + (1.0 - smoothstep(0.0, lw, abs(fract(gz) - 0.5)));
      lines = clamp(lines, 0.0, 1.0) * smoothstep(0.0, 0.12, fade);  // AA the far rows at the horizon
      col = hsl2rgb(uHue, 0.85, 0.5) * lines;
    } else {
      float sky = (uv.y - H) / (1.0 - H);              // 0 at horizon → 1 at top
      float sun = 1.0 - smoothstep(0.0, 0.30, length(vec2((uv.x - 0.5) * 1.5, (uv.y - H) * 2.4)));
      col  = hsl2rgb(uHue + uSpread, 0.75, 0.15) * (1.0 - sky) * 0.5;  // faint sky gradient
      col += hsl2rgb(uHue, 0.9, 0.5) * sun * 0.5;                      // neon horizon sun disc
    }
  } else {
    bool ember = abs(uMode - 1.0) < 0.5;   // uMode==1 (grid=2 handled above, flowing=0)
    // ember RISES vertically (embers/steam over a hearth); the others drift diagonally.
    vec2 drift  = ember ? vec2(0.03*sin(t*1.7), -t*1.5) : vec2(t, t*0.6);
    vec2 drift2 = ember ? vec2(-0.02*sin(t*1.3), -t*1.1) : vec2(-t*0.8, -t);
    // DOMAIN WARP — flow the sample coords through a low-freq fbm field so the flat noise
    // becomes marbled, swirling ribbons (organic + premium; ~+20% structural variance measured).
    // uWarp=0 makes the warp term vanish → byte-identical to the pre-warp field.
    vec2 q = vec2(fbm(p*uScale + drift), fbm(p*uScale + drift2 + 5.2));
    float f = fbm(p*uScale + uWarp*q + drift);
    f += 0.5 * fbm(p*uScale*2.0 + uWarp*0.6*q + drift2);
    float band = smoothstep(1.0-uSharp, 0.95, f);
    float hue = uHue + (ember ? -0.02 : 0.0) + uSpread * sin(f*3.14159 + t);  // ember nudges warm
    // ember adds a soft warm glow floor rising from the bottom edge (uv.y→0 = hearth).
    float glow = ember ? 0.07 * (1.0 - smoothstep(0.0, 0.65, uv.y)) : 0.0;
    // premium silk highlight along the warped ribbon crests (only when warping).
    float sheen = uWarp > 0.0 ? 0.06 * pow(band, 3.0) : 0.0;
    col = hsl2rgb(hue, 0.7, 0.13 + 0.30*band + glow + sheen);
  }
  col *= smoothstep(1.25, 0.2, length(uv-0.5));   // vignette → keeps center text legible
  // PER-HUE PERCEPTUAL-LUMINANCE COMPENSATION — at the same lightness a green/amber brand reads
  // ~3× brighter than a blue one (measured: green 95 vs blue 33), so bright-hue brands shipped an
  // over-bright, content-competing backdrop while blue brands stayed subtle. Normalize toward the
  // blue baseline so EVERY brand hue yields a uniformly subtle atmosphere (text legible regardless).
  // Keyed off uHue (the brand hue) so it's identical for every mode incl. grid.
  vec3 hueRgb = hsl2rgb(uHue, 0.7, 0.5);
  float hueLuma = dot(hueRgb, vec3(0.2126, 0.7152, 0.0722));
  float lumaComp = clamp(0.38 / max(hueLuma, 0.05), 0.45, 1.0);
  vec3 lit = col * uIntensity * lumaComp;
  // FILM-GRAIN DITHER — a sub-perceptual per-frame grain that (a) breaks up 8-bit gradient
  // BANDING on the smooth low-frequency field (an objective rendering artifact on flat WebGL
  // gradients — quantization to 24-bit color leaves visible steps in a slow ramp) and (b) adds a
  // faint cinematic film texture ("glass+grain"). Amplitude ~2/255: imperceptible as noise,
  // decisive against banding. Animated via uTime so it reads as film grain, not a fixed pattern;
  // only runs in the motion-allowed WebGL path (reduced-motion uses the static gradient below,
  // unaffected). Reuses the existing hash(); a scalar added to a vec3 broadcasts to all channels.
  float grain = (hash(gl_FragCoord.xy * 1.3 + fract(uTime * 24.0)) - 0.5) * 0.016;
  gl_FragColor = vec4(lit + grain, 1.0);
}`;

const VERT_SRC = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos,0.0,1.0); }`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
}

interface Props {
  variant?: HeroBackdropVariant;
  className?: string;
}

/**
 * Render the backdrop. Mount it as the FIRST child of a `relative`-positioned hero,
 * before the content, e.g. `<section className="relative"><WebGLHeroBackdrop /> …`.
 */
export function WebGLHeroBackdrop({ variant = 'aurora', className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'webgl' | 'static'>('static');
  const cfg = HERO_BACKDROP_CONFIGS[variant] ?? HERO_BACKDROP_CONFIGS.aurora;

  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const canvas = canvasRef.current;
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas?.getContext('webgl', { antialias: true, alpha: false }) ?? null;
    } catch {
      gl = null;
    }
    const next = resolveBackdropMode({ reducedMotion, webglOk: !!gl, lightTheme: isLightTheme() });
    setMode(next);
    if (next === 'static' || !canvas || !gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) {
      setMode('static');
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setMode('static');
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      hue: gl.getUniformLocation(prog, 'uHue'),
      scale: gl.getUniformLocation(prog, 'uScale'),
      sharp: gl.getUniformLocation(prog, 'uSharp'),
      spread: gl.getUniformLocation(prog, 'uSpread'),
      intensity: gl.getUniformLocation(prog, 'uIntensity'),
      mode: gl.getUniformLocation(prog, 'uMode'),
      warp: gl.getUniformLocation(prog, 'uWarp'),
    };
    const modeFlag =
      variant === 'weave'
        ? 10
        : variant === 'monolith'
        ? 9
        : variant === 'constellation'
        ? 8
        : variant === 'silk'
        ? 7
        : variant === 'terrain'
        ? 6
        : variant === 'smoke'
          ? 5
          : variant === 'petals'
            ? 4
            : variant === 'bokeh'
              ? 3
              : variant === 'grid'
                ? 2
                : variant === 'ember'
                  ? 1
                  : 0;
    const hue = parseBrandHue(
      getComputedStyle(document.documentElement).getPropertyValue('--brand-hue'),
    );

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      if (!canvas || !gl) return;
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let raf = 0;
    let running = true;
    const start = performance.now();
    const frame = () => {
      if (!running || !gl) return;
      resize();
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, (performance.now() - start) / 1000);
      gl.uniform1f(u.hue, hue);
      gl.uniform1f(u.scale, cfg.scale);
      gl.uniform1f(u.sharp, cfg.sharpness);
      gl.uniform1f(u.spread, cfg.hueSpread);
      gl.uniform1f(u.intensity, cfg.intensity);
      gl.uniform1f(u.mode, modeFlag);
      gl.uniform1f(u.warp, cfg.warp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    // Pause when the tab is hidden or the hero scrolls out — no wasted GPU/battery.
    const io = new IntersectionObserver(
      ([e]) => {
        const visible = e?.isIntersecting ?? true;
        if (visible && running && !raf) raf = requestAnimationFrame(frame);
        if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);
    const onVis = () => {
      if (document.hidden && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!document.hidden && !raf) {
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    const onLost = (ev: Event) => {
      ev.preventDefault();
      setMode('static');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [variant, cfg.scale, cfg.sharpness, cfg.hueSpread, cfg.intensity, cfg.warp]);

  // Static brand gradient — the always-legible fallback (reduced-motion / no-WebGL /
  // SSR first paint). Uses the brand tokens so it matches the animated version's palette.
  const staticStyle: CSSProperties = {
    background:
      'radial-gradient(120% 120% at 50% 0%, color-mix(in oklch, var(--color-primary) 22%, transparent), transparent 60%), radial-gradient(90% 90% at 80% 100%, color-mix(in oklch, var(--color-accent) 16%, transparent), transparent 55%)',
  };

  return (
    <div
      aria-hidden="true"
      className={['pointer-events-none absolute inset-0 -z-10 overflow-hidden', className]
        .filter(Boolean)
        .join(' ')}
    >
      {mode === 'webgl' ? (
        <canvas ref={canvasRef} className="h-full w-full" />
      ) : (
        // Keep the canvas ref mountable so the effect can still probe WebGL on the
        // first client pass; the visible layer is the static gradient until 'webgl' wins.
        <>
          <canvas ref={canvasRef} className="absolute h-0 w-0 opacity-0" aria-hidden="true" />
          <div className="h-full w-full" style={staticStyle} />
          {/* Living brand-tinted drift (AL-564) — makes the LIGHT-theme hero (always static, never
              the dark WebGL scene) + the no-WebGL fallback feel alive. opacity:0 under reduced-motion
              (byte-identical to before); corner-pinned so the centered H1 never loses contrast. */}
          <div className="hero-wash" aria-hidden="true" />
          {/* glass sheen — a soft top highlight so the flat fallback reads as a lit surface (depth). */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
            style={{ background: 'linear-gradient(to bottom, color-mix(in oklch, white 7%, transparent), transparent)' }}
          />
          {/* film grain — kills 8-bit banding + adds cinematic texture; STATIC (reduced-motion-safe). */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-[0.06]"
            style={{ backgroundImage: GRAIN_DATA_URI, backgroundSize: '140px 140px' }}
          />
        </>
      )}
    </div>
  );
}
