/**
 * Typed declaration sibling for `webgl-hero-core.mjs`.
 *
 * The `.mjs` core is kept byte-identical with its upstream source in
 * projectsites.dev `apps/project-sites/templates/webgl/` (edit THERE, sync
 * here — see docs/webgl-industry-hero.md). This sibling exists only because
 * the template builds with `tsc -b` and no `allowJs`.
 */

/** Shader variant name → `u_variant` uniform index. */
export declare const VARIANTS: Record<'ember' | 'rays' | 'glint' | 'grid', number>;

/** Options accepted by {@link createWebGLHero} (a resolved preset qualifies). */
export interface WebGLHeroOptions {
  variant?: 'ember' | 'rays' | 'glint' | 'grid';
  palette?: string[];
  background?: string;
  speed?: number;
  intensity?: number;
  density?: number;
  grain?: number;
  maxDpr?: number;
  timeOffset?: number;
  autoStart?: boolean;
}

/**
 * Handle returned by {@link createWebGLHero}. `ok: false` (no DOM / no WebGL /
 * shader failure) carries a `reason` and NO methods — the caller keeps its CSS
 * gradient fallback, so every member beyond `ok` is optional.
 */
export interface WebGLHeroHandle {
  ok: boolean;
  reason?: string;
  canvas?: HTMLCanvasElement;
  start?(): void;
  pause?(): void;
  resume?(): void;
  destroy?(): void;
  /** Render one frame then read `n` sample pixels — the black-broken-shader gate. */
  sample?(n?: number): number[][];
  /** Deterministic render at an absolute shader time (for gates/screenshots). */
  renderAt?(seconds: number): void;
}

/**
 * Mount the ambient WebGL layer into `container` (a positioned element).
 * Returns `{ ok: false, reason }` when WebGL is unavailable — zero errors,
 * the static CSS gradient underneath is the whole treatment.
 */
export declare function createWebGLHero(
  container: HTMLElement,
  opts?: WebGLHeroOptions,
): WebGLHeroHandle;
