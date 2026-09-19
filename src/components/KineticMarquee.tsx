import { cn } from '@/lib/utils';

interface Props {
  /**
   * The phrases to scroll — the business's OWN offering words (feature / service titles), so the
   * ribbon reinforces real content, never lorem. Unfilled `{TOKEN}` placeholders are dropped; if
   * fewer than two real words remain the component renders nothing (embarrassingly-easy: never a
   * broken/empty band).
   */
  words: string[];
  className?: string;
}

/**
 * KineticMarquee — a perspective-tilted, scroll-velocity-coupled typographic ribbon of the
 * business's own offering words (the Framer / Awwwards "velocity marquee" signature). The band
 * drifts continuously so it's ALIVE at rest, AND couples to scroll so the words visibly rush as the
 * visitor moves — set on a subtle 3D receding plane (`rotateX`) so it reads as a cinematic depth
 * band, not a flat ticker. Ambient DECORATION (`aria-hidden`): the offerings it echoes are the real
 * feature/service sections, so a screen reader never hears the words twice and it never traps focus.
 *
 * Safe BY CONSTRUCTION — pure native CSS (NO library, NO JS scroll listener, unlike GSAP/Lenis); the
 * choreography lives entirely in the linked `.ps-kinetic-marquee*` stylesheet (React 19 drops a
 * component's inline `<style>{string}` on the client):
 *   - **LCP-safe** — a BELOW-fold decorative band (never the hero `<h1>`/img); the continuous-drift
 *     keyframe's start frame is identity and the scroll keyframe is a ±4% nudge, so it can never
 *     become the largest contentful paint.
 *   - **INP-safe** — `animation-timeline: scroll(root)` is compositor-driven, OFF the main thread.
 *   - **CLS-safe** — transform-only inside an `overflow:hidden` container; the band never reflows.
 *   - **Fallback-safe** — the scroll coupling lives inside `@supports (animation-timeline: scroll())`
 *     + `@media (prefers-reduced-motion: no-preference)`. Firefox keeps the universally-supported
 *     continuous drift (no scroll coupling); `prefers-reduced-motion: reduce` → the ribbon is
 *     perfectly STATIC + fully legible (no JS branch). Flag-off → the caller renders nothing.
 *
 * Gated by {@link kineticMarqueeEnabled} (`VITE_KINETIC_MARQUEE`, dark by default) so the shipped
 * fleet is byte-for-byte unchanged until promotion; a local preview / E2E proves it live with the
 * `VITE_KINETIC_MARQUEE=1` override before it's promoted. Source: Framer velocity-marquee +
 * Awwwards SOTD ribbon-band showcases — the kinetic layer the one-click AI builders don't ship.
 *
 * @example
 * // A ribbon of the site's feature titles between the services and collection sections:
 * <KineticMarquee words={bentoTiles.map((t) => t.title)} />
 */
export function KineticMarquee({ words, className }: Props) {
  const clean = words
    .map((w) => (w ?? '').trim())
    // Drop unfilled content-pack placeholders (`{FEATURE_1_TITLE}`) and empties.
    .filter((w) => w.length > 0 && !/^\{.*\}$/.test(w));
  // Nothing gorgeous to show → render nothing (never a broken/empty band).
  if (clean.length < 2) return null;
  // Hold the sequence TWICE so the -50% drift keyframe loops seamlessly.
  const seq = [...clean, ...clean];
  return (
    <div
      aria-hidden="true"
      data-kinetic-marquee="1"
      className={cn(
        'ps-kinetic-marquee text-accent pointer-events-none relative select-none py-8 md:py-12',
        className,
      )}
    >
      <div className="ps-kinetic-marquee__row">
        <div className="ps-kinetic-marquee__track">
          {seq.map((word, i) => (
            <span key={i} className="ps-kinetic-marquee__word">
              {word}
              <span className="ps-kinetic-marquee__dot" aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default KineticMarquee;
