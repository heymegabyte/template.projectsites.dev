import { cn } from '@/lib/utils';

interface Props {
  /**
   * Parallax rate multiplier. Higher = drifts MORE as the page scrolls, so layers at different
   * depths separate (the parallax illusion). ~0.5 reads far/stable, ~1.6 reads near/floating.
   */
  depth?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Native CSS scroll-driven DEPTH PARALLAX wrapper — the motion.so / Awwwards signature where
 * background layers drift on the Y axis at per-layer rates as the page scrolls, giving a scene
 * cinematic depth.
 *
 * Cost-free and safe BY CONSTRUCTION (no library, no JS scroll handler):
 * - **LCP-safe** — the drift keyframe is IDENTITY at scroll 0 (`translate3d(0,0,0)`), so the first
 *   paint is unchanged; and this wraps only decorative background layers (never the LCP `<h1>`/img).
 * - **INP-safe** — `animation-timeline: scroll()` is driven by the compositor, OFF the main thread
 *   (unlike GSAP/Lenis JS scroll listeners), so it never costs input latency.
 * - **CLS-safe** — transform-only; the element never reflows.
 * - **Fallback-safe** — the whole effect lives inside `@supports (animation-timeline: scroll())`
 *   AND `@media (prefers-reduced-motion: no-preference)` (see `.ps-parallax` in index.css). Firefox
 *   (no support) and reduced-motion users get the layer perfectly STATIC — no JS branch needed.
 *
 * Always `aria-hidden` + `pointer-events-none`: it is pure decoration and must never trap focus,
 * announce to a screen reader, or block a click.
 *
 * @example
 * // A blurred accent orb that floats up faster than the content behind the hero:
 * <ScrollParallax depth={1.6} className="absolute -top-32 right-[8%] -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
 */
export function ScrollParallax({ depth = 1, className, children }: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn('ps-parallax pointer-events-none', className)}
      style={{ ['--ps-parallax-depth' as string]: String(depth) }}
    >
      {children}
    </div>
  );
}
