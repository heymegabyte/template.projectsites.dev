/**
 * Pure pointer-tilt math for the cinematic 3D TiltCard (Awwwards/Framer-signature depth-on-pointer).
 * Given the pointer's fractional position over an element (0..1 on each axis) and a max tilt in
 * degrees, return the 3D rotation + the glare-highlight position. No DOM, no clock — the component
 * injects the live pointer position; this is unit-pinned so the feel can't silently drift.
 */

export interface Tilt {
  /** rotateX in deg (pointer near top → tilts back, near bottom → tilts forward). */
  readonly rx: number;
  /** rotateY in deg (pointer right → tilts right). */
  readonly ry: number;
  /** glare highlight X, as a `%` string for a radial-gradient center. */
  readonly mx: string;
  /** glare highlight Y, as a `%` string. */
  readonly my: string;
}

/** Clamp `n` into [0, 1]. */
function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Round to 2dp and normalize `-0` → `0` (a `-0` deg is harmless but a smell, and breaks `toEqual`). */
function round2(n: number): number {
  const r = Math.round(n * 100) / 100;
  return r === 0 ? 0 : r;
}

/**
 * @param px - pointer X over the element, 0 (left) … 1 (right).
 * @param py - pointer Y over the element, 0 (top) … 1 (bottom).
 * @param max - max tilt magnitude in degrees (default 8 — subtle, premium, never dizzying).
 * @returns the tilt rotation + glare position. Dead-center (0.5, 0.5) → zero rotation (identity).
 *
 * @example
 * computeTilt(0.5, 0.5, 8) // → { rx: 0, ry: 0, mx: '50%', my: '50%' }  (rest = identity)
 * computeTilt(1, 0.5, 8)   // → { rx: 0, ry: 8, mx: '100%', my: '50%' } (far right → +rotateY)
 */
export function computeTilt(px: number, py: number, max = 8): Tilt {
  const x = clamp01(px);
  const y = clamp01(py);
  const ry = (x - 0.5) * 2 * max; // right of center → positive rotateY
  const rx = -(y - 0.5) * 2 * max; // below center → negative rotateX (tilts toward viewer)
  return {
    rx: round2(rx),
    ry: round2(ry),
    mx: `${Math.round(x * 1000) / 10}%`,
    my: `${Math.round(y * 1000) / 10}%`,
  };
}
