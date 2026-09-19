import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  parseBrandHue,
  resolveBackdropMode,
  backdropForPreset,
  staticBackdropFor,
  demoVariantOverride,
  HERO_BACKDROP_CONFIGS,
  PRESET_BACKDROP,
  GRAIN_DATA_URI,
  type HeroBackdropVariant,
} from './WebGLHeroBackdrop';
import { PRESET_NAMES } from '../../themePresets';

const BACKDROP_SRC = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), './WebGLHeroBackdrop.tsx'),
  'utf8',
);

/**
 * The imperative WebGL path can't run in jsdom (no WebGL context), so these guard
 * the PURE decision logic that governs whether/what the backdrop renders — the
 * bits that keep it LCP-safe + always-legible.
 */

describe('parseBrandHue', () => {
  it('converts a degree string to a 0..1 turn', () => {
    expect(parseBrandHue('195')).toBeCloseTo(195 / 360, 6);
    expect(parseBrandHue('240')).toBeCloseTo(240 / 360, 6);
    expect(parseBrandHue(' 90 ')).toBeCloseTo(90 / 360, 6); // trims
  });
  it('falls back to 240° for blank / NaN / nullish input', () => {
    expect(parseBrandHue('')).toBeCloseTo(240 / 360, 6);
    expect(parseBrandHue(null)).toBeCloseTo(240 / 360, 6);
    expect(parseBrandHue(undefined)).toBeCloseTo(240 / 360, 6);
    expect(parseBrandHue('not-a-number')).toBeCloseTo(240 / 360, 6);
  });
  it('normalizes out-of-range degrees into 0..1', () => {
    expect(parseBrandHue('360')).toBeCloseTo(0, 6);
    expect(parseBrandHue('420')).toBeCloseTo(60 / 360, 6);
    expect(parseBrandHue('-30')).toBeCloseTo(330 / 360, 6);
  });
});

describe('resolveBackdropMode', () => {
  it('renders WebGL only when motion is allowed AND WebGL is available AND theme is dark', () => {
    expect(resolveBackdropMode({ reducedMotion: false, webglOk: true, lightTheme: false })).toBe('webgl');
  });
  it('falls back to static when reduced-motion is requested (accessibility)', () => {
    expect(resolveBackdropMode({ reducedMotion: true, webglOk: true, lightTheme: false })).toBe('static');
  });
  it('falls back to static when WebGL is unavailable', () => {
    expect(resolveBackdropMode({ reducedMotion: false, webglOk: false, lightTheme: false })).toBe('static');
    expect(resolveBackdropMode({ reducedMotion: true, webglOk: false, lightTheme: false })).toBe('static');
  });
  // AL-448: the dark-first field turns a LIGHT theme muddy + drops the dark hero eyebrow/subtitle/
  // badge text to ~1.2:1 (dark-on-dark; axe-blind — it's a <canvas>). Light themes get the static
  // brand gradient so the hero stays clean + the dark text stays legible.
  it('falls back to static on a LIGHT theme even when motion + WebGL are available', () => {
    expect(resolveBackdropMode({ reducedMotion: false, webglOk: true, lightTheme: true })).toBe('static');
  });
});

describe('HERO_BACKDROP_CONFIGS', () => {
  const variants: HeroBackdropVariant[] = [
    'aurora',
    'waves',
    'mesh',
    'ember',
    'grid',
    'bokeh',
    'petals',
    'smoke',
    'terrain',
    'silk',
    'constellation',
    'monolith',
    'weave',
    'velocity',
    'gyro',
    'halftone',
  ];
  it('defines all sixteen variants with sane, text-legible params', () => {
    for (const v of variants) {
      const c = HERO_BACKDROP_CONFIGS[v];
      expect(c).toBeDefined();
      expect(c.scale).toBeGreaterThan(0);
      expect(c.speed).toBeGreaterThan(0);
      expect(c.sharpness).toBeGreaterThan(0);
      expect(c.sharpness).toBeLessThanOrEqual(1);
      expect(c.hueSpread).toBeGreaterThanOrEqual(0);
      // Intensity stays < 1 so the backdrop never overpowers foreground text.
      expect(c.intensity).toBeGreaterThan(0);
      expect(c.intensity).toBeLessThan(1);
      // Domain-warp strength: present + non-negative + bounded (0 = flat legacy field; a runaway
      // warp would smear the field into mush). Every variant is warped (> 0) post-AL-403.
      expect(c.warp, `${v}.warp defined`).toBeTypeOf('number');
      expect(c.warp).toBeGreaterThan(0);
      expect(c.warp).toBeLessThanOrEqual(1.5);
    }
  });
});

describe('backdropForPreset (per-industry hero motion)', () => {
  // Every one of the 13 themeStyle presets must resolve to a real, configured variant
  // so wiring `webglBackdrop={backdropForPreset(brand.themeStyle)}` never renders nothing.
  const ALL_PRESETS = [
    'classic', 'editorial', 'warm', 'luxe', 'brutalist', 'bold', 'futuristic',
    'rugged', 'botanical', 'boutique', 'precision', 'heritage', 'scholarly',
    'noir', 'retro', 'artisan',
  ];
  it('maps every preset to a configured variant', () => {
    for (const p of ALL_PRESETS) {
      const v = backdropForPreset(p);
      expect(HERO_BACKDROP_CONFIGS[v], `${p} → ${v}`).toBeDefined();
    }
  });
  it('matches motion character to personality', () => {
    expect(backdropForPreset('botanical')).toBe('petals'); // AL-511: florist/plant get their OWN falling-petals scene, not shared aurora
    expect(backdropForPreset('noir')).toBe('smoke'); // AL-517: after-dark (tattoo/speakeasy/cocktail) get a cool SMOKE haze, not the warm ember glow
    expect(backdropForPreset('rugged')).toBe('terrain'); // AL-521: outdoor/adventure/landscaping/trades get earthy topographic contours, NOT the tech mesh they used to share
    expect(backdropForPreset('boutique')).toBe('silk'); // AL-525: upscale fashion/jewelry/salon get draped-satin sheen, NOT the soft aurora ribbons they used to share
    expect(backdropForPreset('scholarly')).toBe('constellation'); // AL-532: academic/library/research get a deep-night star map, NOT generic aurora ribbons
    expect(backdropForPreset('brutalist')).toBe('monolith'); // AL-538: bold/architecture/edgy brands get stark concrete slabs + a fault seam, NOT the soft cellular tech mesh they used to share
    expect(backdropForPreset('warm')).toBe('ember'); // food/hospitality — warm rising glow
    expect(backdropForPreset('artisan')).toBe('weave'); // AL-548: craft/maker get an interlaced woven-thread lattice, NOT the food-hearth ember glow they used to share with warm
    expect(backdropForPreset('luxe')).toBe('bokeh'); // premium — its OWN light-mote field, not editorial's waves
    expect(backdropForPreset('editorial')).toBe('halftone'); // media/publishing/magazine/news/blog get the kinetic Ben-Day halftone dot field (the print signature), not the shared waves
    expect(backdropForPreset('heritage')).toBe('waves'); // AL-490: dignified/authoritative (financial/legal/insurance) — NOT ember's cozy hearth glow; heritage keeps the calm swells editorial left behind
    expect(backdropForPreset('futuristic')).toBe('mesh'); // technical, energetic
    expect(backdropForPreset('bold')).toBe('velocity'); // AL-605: energetic/kinetic bold gets its OWN speed-streak scene, not the calm cellular mesh (kept for futuristic)
    expect(backdropForPreset('precision')).toBe('gyro'); // AL-699: engineering/motorsports/machining/aerospace get their OWN precision-instrument gyroscope rings + radar sweep, not the cellular mesh they used to share with futuristic
    expect(backdropForPreset('retro')).toBe('grid'); // synthwave neon perspective grid
  });
  it('demoVariantOverride: `?bg=` previews any scene ONLY on the demo host — never on generated sites (AL-699)', () => {
    // On the demo host, a valid `?bg=` overrides the brand variant (lets a new scene be proven live).
    expect(demoVariantOverride('template.projectsites.dev', '?bg=gyro', 'aurora')).toBe('gyro');
    expect(demoVariantOverride('localhost', '?bg=velocity', 'mesh')).toBe('velocity');
    // Off the demo host (a real generated customer site), the param is IGNORED → brand variant wins.
    expect(demoVariantOverride('acme-motors.projectsites.dev', '?bg=gyro', 'ember')).toBe('ember');
    expect(demoVariantOverride('customdomain.com', '?bg=petals', 'silk')).toBe('silk');
    // Invalid / absent params fall back to the brand variant even on the demo (no crash, no blank scene).
    expect(demoVariantOverride('template.projectsites.dev', '?bg=notarealvariant', 'aurora')).toBe('aurora');
    expect(demoVariantOverride('template.projectsites.dev', '', 'mesh')).toBe('mesh');
    // A prototype-pollution key (`__proto__`) must NOT resolve as a valid variant (hasOwnProperty guard).
    expect(demoVariantOverride('template.projectsites.dev', '?bg=__proto__', 'aurora')).toBe('aurora');
  });

  it('is case-insensitive + total (blank / unknown / nullish → aurora)', () => {
    expect(backdropForPreset('LUXE')).toBe('bokeh');
    expect(backdropForPreset('  futuristic  ')).toBe('mesh');
    expect(backdropForPreset('')).toBe('aurora');
    expect(backdropForPreset('nope')).toBe('aurora');
    expect(backdropForPreset(null)).toBe('aurora');
    expect(backdropForPreset(undefined)).toBe('aurora');
  });
});

describe('PRESET_BACKDROP coverage (drift guard vs themePresets)', () => {
  // Presets get added frequently (5 in recent commits). A newly-added preset with NO
  // PRESET_BACKDROP entry silently falls back to `aurora` in backdropForPreset — so a
  // tech/energetic personality (precision/bold/…) would ship soft ribbons instead of the
  // intended `mesh`, an INVISIBLE per-industry beauty regression. Deriving the expected set
  // from the authoritative PRESET_NAMES (not a hardcoded list) means this fails at CI the
  // moment a preset is added without its backdrop mapping — add both in the same change.
  it('maps EVERY themeStyle preset explicitly (no silent aurora fallback)', () => {
    // Guard against a vacuous pass: a broken/empty PRESET_NAMES import would make the
    // filter trivially [] and hide real drift. The template ships 13 presets today.
    expect(PRESET_NAMES.length).toBeGreaterThanOrEqual(13);
    const unmapped = PRESET_NAMES.filter((name) => !(name in PRESET_BACKDROP));
    expect(unmapped, `presets missing a PRESET_BACKDROP entry: ${unmapped.join(', ') || 'none'}`).toEqual([]);
  });
  it('has no STALE backdrop key that is not a real preset', () => {
    const known = new Set<string>(PRESET_NAMES);
    const stale = Object.keys(PRESET_BACKDROP).filter((k) => !known.has(k));
    expect(stale, `PRESET_BACKDROP keys not in THEME_PRESETS: ${stale.join(', ') || 'none'}`).toEqual([]);
  });
  it('every mapped variant is a configured backdrop', () => {
    for (const [preset, variant] of Object.entries(PRESET_BACKDROP)) {
      expect(HERO_BACKDROP_CONFIGS[variant], `${preset} → ${variant}`).toBeDefined();
    }
  });
});

describe('shader-branch source gate (every variant is actually RENDERED, not silently aurora/black)', () => {
  // The existing tests prove preset→variant→config coverage, but NOT that each variant is
  // wired all the way to a GLSL branch. A new scene variant (config + preset) whose `modeFlag`
  // mapping OR `uMode > N.5` branch is forgotten renders as the mode-0 else-branch (silent
  // wrong-scene = aurora) or, if its modeFlag lands outside the ladder, an unhandled black
  // field — invisible to jsdom + axe (it's a <canvas>). This source-gate (per the
  // canvas-mount-blind-to-black-shader lesson) makes that regression fail at CI, and directly
  // de-risks adding the next per-industry scene (e.g. a `velocity` field for active-gear).
  //
  // aurora/waves/mesh SHARE the flowing mode-0 else-branch (differentiated by config, not a
  // distinct uMode) — every OTHER variant must carry its own modeFlag + shader branch.
  const MODE0 = new Set<HeroBackdropVariant>(['aurora', 'waves', 'mesh']);
  const DISTINCT = (Object.keys(HERO_BACKDROP_CONFIGS) as HeroBackdropVariant[]).filter(
    (v) => !MODE0.has(v),
  );

  it('every distinct variant is mapped in the modeFlag ternary (else it silently renders mode-0 aurora)', () => {
    for (const v of DISTINCT) {
      expect(BACKDROP_SRC, `${v} must appear as \`effectiveVariant === '${v}'\` in the modeFlag mapping`).toContain(
        `effectiveVariant === '${v}'`,
      );
    }
  });

  it('the uMode branch ladder is contiguous 1..(max) — no gap falls a mode through to the wrong scene', () => {
    // Discover the highest uMode the ternary assigns (e.g. weave→10 today), then assert every
    // guard `uMode > 1.5 … > (max-0.5)` exists so modes 2..max each own a branch (mode 1=ember,
    // mode 0=flowing live in the final else). Deriving `max` from the source means the ladder
    // must GROW with the next scene — add its branch in the same change or this fails.
    // Match ONLY the modeFlag ternary arms (`effectiveVariant === 'gyro' ? 12`) so an unrelated
    // integer ternary elsewhere can't false-inflate the ladder requirement.
    const modeNums = [...BACKDROP_SRC.matchAll(/effectiveVariant\s*===\s*'[^']+'\s*\?\s*(\d+)/g)].map((m) =>
      Number(m[1]),
    );
    const maxMode = modeNums.length ? Math.max(...modeNums) : 10;
    for (let n = 1; n <= maxMode - 1; n++) {
      expect(BACKDROP_SRC, `shader must have a \`uMode > ${n}.5\` branch guard`).toContain(`uMode > ${n}.5`);
    }
  });

  it('the uMode uniform comment documents every mode the ternary can emit (author-intent doc stays honest)', () => {
    // The `uniform float uMode; // 0=… 1=ember … 10=weave` comment is the human map of the ladder;
    // guard that it names the highest mode so a new scene updates the doc too (drift catch).
    expect(BACKDROP_SRC).toMatch(/uniform float uMode;[^\n]*13=halftone/);
  });
});

describe('GRAIN_DATA_URI (static-fallback glass+grain)', () => {
  // The static fallback (light-theme / reduced-motion / no-WebGL / first-paint) now carries the
  // same cinematic grain the WebGL shader does. Guard the inline noise tile so it can't silently
  // rot into a broken/networked URL (which would kill the LCP-safe, zero-network guarantee).
  it('is an inline SVG feTurbulence data URI (no network, LCP-safe)', () => {
    // starts with the inline data-URI scheme → self-contained, never a networked fetch
    // (the only http here is the required SVG xmlns namespace, not an asset reference).
    expect(GRAIN_DATA_URI.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(GRAIN_DATA_URI).toContain('feTurbulence');
    expect(GRAIN_DATA_URI).toContain('fractalNoise');
    // no external asset fetch (an http(s) reference INSIDE a url() other than the data URI).
    expect(GRAIN_DATA_URI).not.toContain('url(http');
    expect(GRAIN_DATA_URI.trim().endsWith('")')).toBe(true);
  });
});

describe('pointer + scroll parallax (cinematic-3D #1) — default-on every scene, INP-safe, reduced-motion-off', () => {
  it('declares the uParallax uniform + applies it to uv (shifts EVERY scene uniformly)', () => {
    expect(BACKDROP_SRC).toMatch(/uniform vec2 uParallax/);
    expect(BACKDROP_SRC).toMatch(/uv \+= uParallax/);
  });
  it('wires PASSIVE pointermove + scroll listeners AFTER the reduced-motion early-return (static path attaches none)', () => {
    expect(BACKDROP_SRC).toMatch(/addEventListener\('pointermove'[\s\S]*?passive:\s*true/);
    expect(BACKDROP_SRC).toMatch(/addEventListener\('scroll'[\s\S]*?passive:\s*true/);
    const guardAt = BACKDROP_SRC.indexOf("next === 'static'");
    const listenerAt = BACKDROP_SRC.indexOf("addEventListener('pointermove'");
    expect(guardAt, 'reduced-motion static guard present').toBeGreaterThan(-1);
    expect(listenerAt, 'listeners wired only after the static early-return').toBeGreaterThan(guardAt);
  });
  it('RAF-smooths (lerps) toward the target + sets the uniform each frame', () => {
    expect(BACKDROP_SRC).toMatch(/pCur\.x \+=/);
    expect(BACKDROP_SRC).toMatch(/gl\.uniform2f\(u\.parallax/);
  });
  it('removes both listeners on cleanup (no leak)', () => {
    expect(BACKDROP_SRC).toMatch(/removeEventListener\('pointermove'/);
    expect(BACKDROP_SRC).toMatch(/removeEventListener\('scroll'/);
  });
});

describe('staticBackdropFor (per-variant reduced-motion / no-WebGL fallback)', () => {
  const variants = Object.keys(HERO_BACKDROP_CONFIGS) as HeroBackdropVariant[];

  it('returns a brand-tinted, non-empty CSS background for EVERY variant (never flat/blank)', () => {
    for (const v of variants) {
      const bg = staticBackdropFor(v);
      expect(bg.length).toBeGreaterThan(20);
      expect(bg).toContain('color-mix(in oklch'); // brand-token tinted, not a hardcoded colour
      expect(bg).toMatch(/var\(--color-(primary|accent)\)/);
    }
  });

  it('gives the 6 scene-distinct variants their OWN backdrop (not the generic wash, nor each other)', () => {
    const generic = staticBackdropFor('aurora');
    expect(staticBackdropFor('grid')).toContain('repeating-linear-gradient'); // synthwave perspective grid
    expect(staticBackdropFor('terrain')).toContain('repeating-radial-gradient'); // topographic contour rings
    expect(staticBackdropFor('monolith')).toContain('linear-gradient(93deg'); // brutalist fault seam
    expect(staticBackdropFor('silk')).toContain('linear-gradient(105deg'); // boutique draped-satin sheen
    expect(staticBackdropFor('velocity')).toContain('repeating-linear-gradient(115deg'); // bold speed-streaks
    expect(staticBackdropFor('gyro')).toContain('linear-gradient(0deg'); // precision crosshair reticle
    const bespoke = ['grid', 'terrain', 'monolith', 'silk', 'velocity', 'gyro'] as HeroBackdropVariant[];
    for (const v of bespoke) expect(staticBackdropFor(v)).not.toBe(generic);
    expect(new Set(bespoke.map((v) => staticBackdropFor(v))).size).toBe(6);
  });

  it('falls back to the generic twin-radial wash for the soft-glow variants (aurora/waves/mesh/…)', () => {
    const generic = staticBackdropFor('aurora');
    expect(generic).toContain('radial-gradient(120% 120% at 50% 0%');
    for (const v of ['waves', 'mesh', 'smoke', 'bokeh'] as HeroBackdropVariant[]) {
      expect(staticBackdropFor(v)).toBe(generic);
    }
  });
});
