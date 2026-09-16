import { describe, it, expect } from 'vitest';
import { computeTilt } from './tilt';

describe('computeTilt — pointer 3D-tilt math', () => {
  it('dead-center is IDENTITY (rest state → no rotation, LCP-safe)', () => {
    expect(computeTilt(0.5, 0.5, 8)).toEqual({ rx: 0, ry: 0, mx: '50%', my: '50%' });
  });

  it('far right → max +rotateY; far left → max -rotateY', () => {
    expect(computeTilt(1, 0.5, 8).ry).toBe(8);
    expect(computeTilt(0, 0.5, 8).ry).toBe(-8);
  });

  it('top → +rotateX, bottom → -rotateX (tilts toward the viewer below center)', () => {
    expect(computeTilt(0.5, 0, 8).rx).toBe(8);
    expect(computeTilt(0.5, 1, 8).rx).toBe(-8);
  });

  it('never exceeds ±max on either axis (clamped input)', () => {
    for (const [px, py] of [[-1, -1], [2, 2], [1, 0]] as const) {
      const t = computeTilt(px, py, 8);
      expect(Math.abs(t.rx)).toBeLessThanOrEqual(8);
      expect(Math.abs(t.ry)).toBeLessThanOrEqual(8);
    }
  });

  it('glare position tracks the pointer as a % string', () => {
    expect(computeTilt(0.25, 0.75, 8)).toMatchObject({ mx: '25%', my: '75%' });
  });
});
