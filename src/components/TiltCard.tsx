import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { computeTilt } from '@/lib/tilt';

interface Props {
  children: ReactNode;
  /** Classes for the tilting inner element (e.g. the framed card's `card-tactile …`). */
  className?: string;
  /** Max tilt magnitude in degrees (default 8 — subtle, premium). */
  max?: number;
  /** Render the pointer-tracking glare highlight (default true). */
  glare?: boolean;
}

/**
 * Cinematic pointer-driven 3D tilt (Awwwards/Framer/motion.so-signature depth). Wraps `children`
 * in a perspective plane that rotates toward the pointer with a light-catching glare — the premium
 * "the surface has depth" feel.
 *
 * LCP + a11y by construction:
 *   - IDENTITY at rest (no pointer / no listener) → the wrapped hero `<img>` paints undisturbed, so
 *     it stays the LCP element; the transform is a POST-hydration, pointer-only enhancement.
 *   - Gated on `(pointer: fine)` AND `prefers-reduced-motion: no-preference` — a touch device or a
 *     reduced-motion visitor gets the plain, static card (no listeners attached at all).
 *   - `pointermove` is rAF-throttled + passive → INP-safe; transform/opacity only → zero CLS.
 *   - The glare is `aria-hidden` decorative.
 */
export function TiltCard({ children, className, max = 8, glare = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia) return;
    // Gate: fine pointer + motion allowed. Otherwise leave the card static (no listeners).
    if (
      !window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const t = computeTilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, max);
        el.style.setProperty('--tilt-rx', `${t.rx}deg`);
        el.style.setProperty('--tilt-ry', `${t.ry}deg`);
        el.style.setProperty('--tilt-mx', t.mx);
        el.style.setProperty('--tilt-my', t.my);
        el.dataset.tilting = '1';
      });
    };
    const onLeave = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      el.style.setProperty('--tilt-rx', '0deg');
      el.style.setProperty('--tilt-ry', '0deg');
      el.dataset.tilting = '0';
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [max]);

  return (
    <div className="tilt-persp">
      <div ref={ref} data-tilt className={cn('tilt-inner', className)}>
        {children}
        {glare && <span aria-hidden="true" className="tilt-glare" />}
      </div>
    </div>
  );
}
