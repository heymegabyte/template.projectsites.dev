import { describe, it, expect } from 'vitest';
import {
  parseBrandHue,
  resolveBackdropMode,
  backdropForPreset,
  HERO_BACKDROP_CONFIGS,
  PRESET_BACKDROP,
  GRAIN_DATA_URI,
  type HeroBackdropVariant,
} from './WebGLHeroBackdrop';
import { PRESET_NAMES } from '../../themePresets';

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
  const variants: HeroBackdropVariant[] = ['aurora', 'waves', 'mesh', 'ember', 'grid', 'bokeh'];
  it('defines all six variants with sane, text-legible params', () => {
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
    expect(backdropForPreset('botanical')).toBe('aurora'); // organic, calm
    expect(backdropForPreset('warm')).toBe('ember'); // food/hospitality — warm rising glow
    expect(backdropForPreset('luxe')).toBe('bokeh'); // premium — its OWN light-mote field, not editorial's waves
    expect(backdropForPreset('editorial')).toBe('waves'); // authoritative, measured
    expect(backdropForPreset('heritage')).toBe('waves'); // AL-490: dignified/authoritative (financial/legal/insurance) — NOT ember's cozy hearth glow
    expect(backdropForPreset('futuristic')).toBe('mesh'); // technical, energetic
    expect(backdropForPreset('bold')).toBe('mesh');
    expect(backdropForPreset('precision')).toBe('mesh');
    expect(backdropForPreset('retro')).toBe('grid'); // synthwave neon perspective grid
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
