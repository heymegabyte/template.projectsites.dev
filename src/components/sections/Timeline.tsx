import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { cdnImageProps } from '@/lib/cdn-image';

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  link?: { href: string; label: string };
  image?: string;
  imageAlt?: string;
}

interface Props {
  events: TimelineEvent[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  className?: string;
  /** Direction the timeline grows. Default `vertical`. */
  orientation?: 'vertical' | 'horizontal';
}

/**
 * Component-scoped cinematic styles. Every class is prefixed `.tl-` so it never
 * collides with global/shared styles. ALL motion is DOUBLE-gated: the scroll-drawn
 * accent rail, the per-event entrance stagger, the node "pop" pulse, and the hover
 * lift run ONLY when both `prefers-reduced-motion: no-preference` AND
 * `prefers-reduced-data: no-preference` hold. When either is reduced, every event is
 * shown in its final state with zero motion (mirrored in the JS gate + a CSS reset),
 * and the rail renders fully drawn — so the section is always legible and complete.
 *
 * Cinematic layer:
 * - OKLCH accent gradient rail (cyan → violet) that DRAWS DOWN on scroll via a
 *   `scaleY` scroll-timeline, with a soft travelling glow.
 * - Per-event entrance stagger keyed on the inline `--tl-i`, plus a node that
 *   pops in with an expanding accent pulse ring.
 * - `clamp()` fluid year/title sizing, `text-wrap: balance` headings /
 *   `text-wrap: pretty` copy, glass hover-lift on horizontal cards.
 */

/**
 * Reads the two "no-preference" media queries. When either is unavailable or the
 * user has opted into reduced motion/data, the entrance-stagger is skipped and every
 * event renders in its final state. SSR-safe (returns `false` without `window`).
 */
function motionAllowed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return (
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches &&
    window.matchMedia('(prefers-reduced-data: no-preference)').matches
  );
}

/**
 * Historical timeline section.
 *
 * For real historical content with dated events, use `image` carefully —
 * see `~/.claude/rules/always.md` rule "Every historical timeline" — only
 * primary-source photos (Wikimedia Commons, Library of Congress, NPGallery,
 * archive material). Never AI-generated or "evocative" stock next to a
 * dated event. Blank entry > faked entry.
 *
 * Cinematic layer is fully component-scoped (`.tl-` prefix) and double-gated —
 * see {@link SCOPED_CSS}. The base (no-motion) state always shows every event and
 * a fully-drawn accent rail, so nothing is hidden behind an un-fired animation.
 */
export function Timeline({
  events,
  eyebrow,
  headline,
  description,
  orientation = 'vertical',
  className,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Toggle the entrance-stagger only once the band scrolls in, and only when
  // motion is allowed (otherwise items are shown immediately by the CSS gate).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !motionAllowed() || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (events.length === 0) return null;

  return (
    <section
      ref={rootRef}
      data-inview={inView ? 'true' : 'false'}
      className={cn('tl-root py-24 md:py-32 max-w-container-normal mx-auto px-6', className)}
    >
      {(eyebrow || headline) && (
        <div className="text-center mb-16 reveal-on-view">
          {eyebrow && <span className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</span>}
          {headline && (
            <h2 className="text-balance text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{headline}</h2>
          )}
          {description && <p className="text-pretty text-text-muted max-w-2xl mx-auto">{description}</p>}
        </div>
      )}

      {orientation === 'vertical' ? (
        <ol className="tl-list">
          {events.map((e, i) => {
            // Responsive + modern-format props for the entry photo (medium: full-width on phone,
            // ~1/2 beside the entry text on desktop). Additive (falls back to src); no-op non-CDN.
            const eimg = e.image ? cdnImageProps(e.image, '(max-width: 768px) 100vw, 50vw') : null;
            return (
            <li key={`${e.year}-${i}`} className="tl-item" style={{ '--tl-i': i } as CSSProperties}>
              <span aria-hidden="true" className="tl-node" />
              <time className="tl-year font-mono text-accent" dateTime={e.year}>
                {e.year}
              </time>
              <h3 className="tl-title text-text font-heading">{e.title}</h3>
              {e.image && (
                <figure className="tl-fig">
                  <img
                    src={eimg?.src ?? e.image}
                    srcSet={eimg?.srcSet}
                    sizes={eimg?.sizes}
                    alt={e.imageAlt ?? ''}
                    decoding="async"
                    loading="lazy"
                  />
                </figure>
              )}
              <p className="tl-desc text-text-muted">{e.description}</p>
              {e.link && (
                <a
                  href={e.link.href}
                  className="inline-block mt-3 text-sm text-accent underline-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
                  {...(e.link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {e.link.label} →
                </a>
              )}
            </li>
            );
          })}
        </ol>
      ) : (
        <ol className="tl-track">
          {events.map((e, i) => (
            <li key={`${e.year}-${i}`} className="tl-card tl-item" style={{ '--tl-i': i } as CSSProperties}>
              <time className="tl-year font-mono text-accent" dateTime={e.year}>
                {e.year}
              </time>
              <h3 className="tl-title text-text font-heading" style={{ fontSize: 'clamp(1.05rem, 0.95rem + 0.5vw, 1.3rem)' }}>
                {e.title}
              </h3>
              <p className="tl-desc text-text-muted text-sm">{e.description}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default Timeline;
