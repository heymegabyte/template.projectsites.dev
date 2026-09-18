/**
 * Magnetic-button pull vector — the "reach toward the cursor from a distance" magnet. Given the
 * pointer's offset from the button centre (`dx`, `dy`), pull the button a fraction (`strength`) of
 * that offset, scaled by proximity so the pull FADES to zero at the edge of `radius` and is zero
 * beyond it. Pure (same inputs → same output); extracted for deterministic unit tests, mirroring
 * `computeTilt` in `./tilt`.
 *
 * @param dx - pointer x minus button-centre x, in px
 * @param dy - pointer y minus button-centre y, in px
 * @param strength - fraction of the offset to pull (0-1; ~0.3 is subtle/premium)
 * @param radius - px distance from centre beyond which there is NO pull
 * @returns `{ x, y }` translation in px (0,0 when the pointer is beyond `radius`)
 * @example computeMagnet(0, 0, 0.35, 90) // → { x: 0, y: 0 }  (cursor at centre → no pull)
 * @example computeMagnet(200, 0, 0.35, 90) // → { x: 0, y: 0 }  (beyond radius → released)
 * @example computeMagnet(45, 0, 0.4, 90) // → { x: 9, y: 0 }  (half-radius → half-strength pull)
 */
export function computeMagnet(
  dx: number,
  dy: number,
  strength: number,
  radius: number,
): { x: number; y: number } {
  const dist = Math.hypot(dx, dy);
  if (dist > radius || radius <= 0) return { x: 0, y: 0 };
  const factor = 1 - dist / radius; // 1 at centre → 0 at the radius edge
  return { x: dx * strength * factor, y: dy * strength * factor };
}
