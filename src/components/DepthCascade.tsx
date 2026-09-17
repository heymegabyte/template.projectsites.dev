import { type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { scrollCinemaEnabled } from '@/lib/featureFlags';

interface Props {
  /** Element to render as (default `div`). Use `ol`/`ul` for a list group, `section` for a band. */
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

/**
 * Scroll-driven 3D depth-cascade wrapper — the motion.so / Awwwards "content emerges from depth"
 * signature. Wrap a below-fold group and, when the `scroll_cinema` flag is on, its DIRECT children
 * cascade forward out of Z-depth (staggered per position) as the group scrolls into view; the
 * cinematic choreography lives entirely in the shipped `.ps-depth-cascade` stylesheet rules
 * (native `animation-timeline: view()`), so this component only toggles the class — ZERO runtime
 * motion code.
 *
 * Dark by default: when {@link scrollCinemaEnabled} is false the wrapper is a PLAIN element
 * (children render byte-for-byte as before), so the shipped fleet is unchanged until the flag is
 * promoted. Safe by construction (see `.ps-depth-cascade` in index.css): LCP-safe (below-fold,
 * settled frame is identity, NEVER wrap the hero LCP element), INP-safe (compositor-driven),
 * CLS-safe (transform/opacity only), and STATIC + fully visible under Firefox / reduced-motion.
 * Renders real content (not decoration) — never `aria-hidden`, never a focus trap.
 *
 * @example
 * // Feature cards rise front-to-back as the grid scrolls in (only when VITE_SCROLL_CINEMA=1):
 * <DepthCascade className="grid md:grid-cols-3 gap-6">
 *   {features.map((f) => <FeatureCard key={f.id} {...f} />)}
 * </DepthCascade>
 */
export function DepthCascade({ as: Tag = 'div', className, children }: Props) {
  const on = scrollCinemaEnabled();
  return (
    <Tag
      className={cn(on && 'ps-depth-cascade', className)}
      {...(on ? { 'data-depth-cascade': '1' } : {})}
    >
      {children}
    </Tag>
  );
}

export default DepthCascade;
