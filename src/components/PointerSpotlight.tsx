import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Cursor-follow ambient spotlight — a soft radial glow that tracks the pointer across its
 * parent, adding premium interactive depth (the Linear / motion.so signature). Mount inside a
 * `position: relative; overflow: hidden` container.
 *
 * LCP/INP-safe by construction:
 *  - A FIXED-SIZE gradient layer moved by `transform: translate3d(var(--px), var(--py), 0)` —
 *    a compositor-only transform, NO repaint of the gradient (only its position changes).
 *  - The CSS vars are updated at most ONCE per animation frame from a PASSIVE `pointermove`.
 *  - No canvas, no WebGL, no library, and it is NOT the LCP element (a decorative gradient div).
 *
 * Accessibility + motion:
 *  - `aria-hidden` + `pointer-events-none` — purely decorative, never in the a11y tree or hit-test.
 *  - Gated to `(pointer: fine)` + `prefers-reduced-motion: no-preference`: on touch or
 *    reduced-motion the tracking listener never attaches and the layer shows the tasteful STATIC
 *    centered glow the CSS renders by default (still gorgeous, zero motion).
 */
export function PointerSpotlight({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent || typeof window.matchMedia !== 'function') return;

    // Only track on a fine pointer with motion allowed; otherwise the CSS static glow stands.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    if (!fine || !motionOk) return;

    el.dataset.tracking = '1'; // CSS: dim the static glow, let the tracked one lead
    let raf = 0;
    let x = 0;
    let y = 0;
    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      x = e.clientX - r.left;
      y = e.clientY - r.top;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          el.style.setProperty('--px', `${x}px`);
          el.style.setProperty('--py', `${y}px`);
          el.style.setProperty('--spot-opacity', '1');
        });
      }
    };
    const onLeave = () => el.style.setProperty('--spot-opacity', '0');

    parent.addEventListener('pointermove', onMove, { passive: true });
    parent.addEventListener('pointerleave', onLeave, { passive: true });
    return () => {
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className={cn('pointer-spotlight', className)} />;
}

export default PointerSpotlight;
