import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  THEME_PRESETS,
  PRESET_NAMES,
  DEFAULT_PRESET,
  CLASS_TO_PRESET,
  resolvePreset,
  normalizePresetName,
  presetForClass,
  type ThemePreset,
} from './themePresets.ts';

const RADIUS_KEYS: (keyof ThemePreset['radius'])[] = ['sm', 'md', 'lg', 'xl', '2xl', 'full'];
const SHADOW_KEYS: (keyof ThemePreset['shadow'])[] = ['sm', 'md', 'lg', 'glow'];
const DURATION_KEYS: (keyof ThemePreset['motion']['duration'])[] = ['fast', 'base', 'slow', 'scroll'];

describe('themePresets', () => {
  it('every preset has a structurally complete bundle', () => {
    for (const name of PRESET_NAMES) {
      const p = THEME_PRESETS[name];
      expect(p.label, `${name}.label`).toBeTruthy();
      expect(p.when, `${name}.when`).toBeTruthy();
      expect(p.font.heading, `${name}.font.heading`).toBeTruthy();
      expect(p.font.body, `${name}.font.body`).toBeTruthy();
      expect(p.font.mono, `${name}.font.mono`).toBeTruthy();
      for (const k of RADIUS_KEYS) expect(typeof p.radius[k], `${name}.radius.${k}`).toBe('string');
      for (const k of SHADOW_KEYS) expect(typeof p.shadow[k], `${name}.shadow.${k}`).toBe('string');
      expect(p.motion.easing, `${name}.motion.easing`).toContain('cubic-bezier');
      for (const k of DURATION_KEYS) expect(p.motion.duration[k], `${name}.motion.${k}`).toMatch(/ms$/);
    }
  });

  it('classic is the default and reproduces the historical look verbatim', () => {
    expect(DEFAULT_PRESET).toBe('classic');
    const c = THEME_PRESETS.classic;
    expect(c.font).toEqual({ heading: 'Space Grotesk', body: 'Inter', mono: 'JetBrains Mono' });
    expect(c.radius).toEqual({ sm: '0.375rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem', full: '9999px' });
    expect(c.motion.easing).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
    expect(c.motion.duration).toEqual({ fast: '150ms', base: '250ms', slow: '450ms', scroll: '1200ms' });
  });

  it('covers every documented vertical personality', () => {
    expect(new Set(PRESET_NAMES)).toEqual(
      new Set([
        'classic',
        'editorial',
        'warm',
        'luxe',
        'brutalist',
        'bold',
        'futuristic',
        'rugged',
        'botanical',
        'boutique',
        'precision',
        'heritage',
        'scholarly',
        'noir',
        'retro',
        'artisan',
      ]),
    );
  });

  it('resolves each new elaborate personality to its distinctive font', () => {
    expect(resolvePreset('botanical').font.heading).toBe('Poppins');
    expect(resolvePreset('boutique').font.heading).toBe('Fraunces');
    expect(resolvePreset('precision').font.heading).toBe('Rajdhani');
    expect(resolvePreset('heritage').font.heading).toBe('Libre Baskerville');
    expect(resolvePreset('scholarly').font.heading).toBe('Quicksand');
    expect(resolvePreset('noir').font.heading).toBe('Cinzel');
    expect(resolvePreset('retro').font.heading).toBe('Bricolage Grotesque');
    expect(resolvePreset('artisan').font.heading).toBe('Spectral');
  });

  it('resolvePreset never throws and falls back to classic on bad input', () => {
    expect(resolvePreset('warm').font.heading).toBe('Poppins');
    expect(resolvePreset('LUXE').font.heading).toBe('Playfair Display'); // case-insensitive
    expect(resolvePreset('  editorial  ').label).toBe('Editorial'); // trimmed
    for (const bad of [undefined, null, '', 'nope', 42, {}, []]) {
      expect(resolvePreset(bad as unknown), String(bad)).toBe(THEME_PRESETS.classic);
    }
  });

  it('normalizePresetName returns a valid PresetName for anything', () => {
    expect(normalizePresetName('BRUTALIST')).toBe('brutalist');
    expect(normalizePresetName('garbage')).toBe('classic');
    expect(normalizePresetName(undefined)).toBe('classic');
    for (const n of PRESET_NAMES) expect(normalizePresetName(n)).toBe(n);
  });

  it('presetForClass maps every businessClass to a valid preset (self-healing)', () => {
    // Every value in the class map must be a real preset name.
    for (const [cls, style] of Object.entries(CLASS_TO_PRESET)) {
      expect(PRESET_NAMES, `${cls}→${style}`).toContain(style);
    }
    expect(presetForClass('legal')).toBe('editorial');
    expect(presetForClass('salon')).toBe('warm');
    expect(presetForClass('portfolio')).toBe('brutalist');
    expect(presetForClass('gym')).toBe('bold'); // athletic, not soft-warm
    expect(presetForClass('auto-repair')).toBe('rugged'); // industrial, not geometric-classic
    expect(presetForClass('medical')).toBe('botanical'); // calming-fresh, not generic editorial
    expect(presetForClass('retail')).toBe('boutique'); // chic-tactile, not geometric-classic
    expect(presetForClass('SAAS')).toBe('futuristic'); // case-insensitive; glassy, not classic
    for (const bad of [undefined, null, '', 'nope', 42]) {
      expect(presetForClass(bad as unknown), String(bad)).toBe('classic');
    }
  });

  it('covers the full businessClass enum from brandSchema', () => {
    const ENUM = ['storefront', 'restaurant', 'medical', 'retail', 'salon', 'gym', 'auto-repair', 'saas', 'portfolio', 'nonprofit', 'legal', 'organization'];
    for (const cls of ENUM) expect(Object.keys(CLASS_TO_PRESET), cls).toContain(cls);
  });

  // Drift guard: every personality must ship a distinguishing `:root[data-style]`
  // flourish in index.css. `classic` is the historical default and intentionally
  // has none. This gate exists because botanical/boutique/precision/heritage/
  // scholarly originally shipped flourish-less (rendered generic) — a preset
  // without a flourish is a half-built theme.
  it('every non-classic preset has a :root[data-style] flourish in index.css', () => {
    // cwd is the package root under `vitest run`; import.meta.url is not file:// under Vite's transform.
    const css = readFileSync('src/index.css', 'utf8');
    for (const name of PRESET_NAMES) {
      if (name === 'classic') continue;
      expect(css, `${name} needs a :root[data-style='${name}'] flourish`).toContain(`:root[data-style='${name}']`);
    }
  });
});
