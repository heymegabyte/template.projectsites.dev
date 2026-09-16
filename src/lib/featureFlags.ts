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
