/**
 * Typed declaration sibling for `presets.mjs`.
 *
 * The `.mjs` preset data is kept byte-identical with its upstream source in
 * projectsites.dev `apps/project-sites/templates/webgl/` (edit THERE, sync
 * here — see docs/webgl-industry-hero.md). This sibling exists only because
 * the template builds with `tsc -b` and no `allowJs`.
 */

/** One industry theme preset: a shader variant + tuned uniforms. */
export interface WebGLHeroPreset {
  variant: 'ember' | 'rays' | 'glint' | 'grid';
  /** Base canvas color, `#rrggbb` — match the hero surface. */
  background: string;
  /** `[A, B, C]` = primary glow, particle/accent, atmosphere (`#rrggbb`). */
  palette: string[];
  /** Global time multiplier, 0.2–2.0. */
  speed: number;
  /** Effect strength vs background, 0.3–1.5. */
  intensity: number;
  /** Particle/line density, 3–18. */
  density: number;
  /** Film grain amount, 0–0.06. */
  grain: number;
  /** Prose: what the treatment must evoke (gate rubric line). */
  mood?: string;
}

/** Per-industry presets keyed by vertical (restaurant / nonprofit / retail / …). */
export declare const WEBGL_PRESETS: Record<string, WebGLHeroPreset>;

/**
 * Resolve the preset for a vertical/industry key with optional per-field
 * overrides (pack `webgl` block / live theme tokens). Unknown verticals fall
 * back through the alias map to the professional grid — always sane.
 */
export declare function resolveWebGLPreset(
  vertical?: string,
  overrides?: Partial<WebGLHeroPreset>,
): WebGLHeroPreset;

/** Light validation for pack-authored `webgl` blocks; `[]` = valid. */
export declare function validateWebGLConfig(cfg: unknown): string[];
