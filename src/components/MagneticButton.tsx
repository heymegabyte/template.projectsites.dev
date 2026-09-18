import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { computeMagnet } from '@/lib/magnet';

interface Props {
  children: ReactNode;
  /** Extra classes for the magnetic wrapper. */
  className?: string;
  /** Fraction of the pointer offset the button pulls toward (0-1). Default 0.32 — subtle/premium. */
  strength?: number;
  /** Px radius around the button centre within which the magnet engages. Default 90. */
  radius?: number;
}

/**
 * Magnetic CTA — the Framer / Awwwards / motion.so signature "the button reaches toward your
 * cursor" micro-interaction: as the pointer nears, the wrapped control leans toward it (pull fading
 * with distance) while a soft brand-coloured halo tracks the cursor; it springs back to rest when
 * the pointer moves away. A WRAPPER (not a `<button>`), so it composes over the hero's
 * `<Button asChild><Link/></Button>` (an `<a>`), pricing CTAs, anything.
 *
 * LCP + a11y + easy-to-use BY CONSTRUCTION (mirrors {@link TiltCard}):
 *   - IDENTITY at rest — `--mag-x/y` unset → `translate(0,0)`, a pointer-only enhancement —
 *     so wrapping the hero CTA never shifts layout or delays paint; the hero `<img>`/H1 stays the
 *     LCP element. A POST-hydration, pointer-only enhancement.
 *   - Gated on `(pointer: fine)` AND `prefers-reduced-motion: no-preference` — a touch device or a
 *     reduced-motion visitor gets the plain, static button with ZERO listeners attached.
 *   - `pointermove` rAF-throttled + passive, the rect read once per frame → INP-safe; translate /
 *     opacity only → zero CLS.
 *   - The click / keyboard target is UNCHANGED — the magnet only nudges the button a few px toward a
 *     cursor already near it, so the click always lands (embarrassingly-easy: delight, not an
 *     obstacle). Beyond `radius` the pull is released to rest.
 *   - The halo is `aria-hidden` decorative and `pointer-events: none`.
 *
 * Scoped CSS lives in `src/index.css` (`.magnetic-cta` / `.magnetic-glow`) — a LINKED stylesheet,
 * never an inline `<style>` (React 19 drops a component's string-child `<style>` on the client).
 */
export function MagneticButton({ children, className, strength = 0.32, radius = 90 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !window.matchMedia) return;
    // Gate: fine pointer + motion allowed. Otherwise leave the button static (no listeners).
    if (
      !window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const m = computeMagnet(px - cx, py - cy, strength, radius);
      if (m.x === 0 && m.y === 0) {
        // Out of range → release to rest (also un-highlights the halo).
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
        el.dataset.magnetic = '0';
        return;
      }
      el.style.setProperty('--mag-x', `${m.x}px`);
      el.style.setProperty('--mag-y', `${m.y}px`);
      el.style.setProperty('--mag-gx', `${((px - r.left) / r.width) * 100}%`);
      el.style.setProperty('--mag-gy', `${((py - r.top) / r.height) * 100}%`);
      el.dataset.magnetic = '1';
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    // Document-level so the button reaches toward a cursor that is NEAR (within `radius`) but not yet
    // over it — the true magnetic feel. One passive listener + a per-frame rect read is INP-safe.
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return (
    <span ref={ref} data-magnetic className={cn('magnetic-cta', className)}>
      {children}
      <span aria-hidden="true" className="magnetic-glow" />
    </span>
  );
}

export default MagneticButton;
