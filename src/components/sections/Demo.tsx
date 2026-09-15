import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** URL of the demo to embed. */
  src: string;
  /** Required label for accessibility + AI-search context. */
  title: string;
  /** Optional poster image shown until activate. */
  poster?: { src: string; alt: string };
  /** Section header. */
  eyebrow?: string;
  headline?: string;
  description?: string;
  /** Aspect ratio for the embed. Default 16/10. */
  aspect?: string;
  /** Add a "Open in new tab" link next to the embed. Default true. */
  externalLink?: boolean;
  className?: string;
}

/**
 * Demo iframe embed (idea #68) — lazy-loads only after user clicks.
 *
 * Avoids the ~200KB+ initial-paint cost of embedding live demos that aren't
 * actually visible to most visitors. Poster image up front, real iframe on
 * click. Mirrors the privacy-first pattern from VideoEmbed.
 *
 * Use for product demos, interactive playgrounds, calculators, Storybook,
 * Cal.com embeds, etc.
 */
export function Demo({
  src,
  title,
  poster,
  eyebrow,
  headline,
  description,
  aspect = '16 / 10',
  externalLink = true,
  className,
}: Props) {
  const [active, setActive] = useState(false);

  return (
    <section className={cn('py-20 md:py-28 max-w-container-wide mx-auto px-6', className)}>
      {(eyebrow || headline || description) && (
        <div className="text-center mb-10 reveal-on-view">
          {eyebrow && (
            <p className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</p>
          )}
          {headline && (
            <h2 className="mt-4 text-3xl md:text-5xl font-bold font-heading text-text">{headline}</h2>
          )}
          {description && (
            <p className="mt-4 text-text-muted text-lg max-w-2xl mx-auto">{description}</p>
          )}
        </div>
      )}

      <figure className="card-tactile overflow-hidden rounded-2xl">
        <div className="relative" style={{ aspectRatio: aspect }}>
          {!active ? (
            <button
              type="button"
              onClick={() => setActive(true)}
              className="group absolute inset-0 cursor-pointer"
              aria-label={`Launch demo: ${title}`}
            >
              {poster ? (
                <img
                  src={poster.src}
                  alt={poster.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-surface to-surface-elevated" />
              )}
              <div className="absolute inset-0 bg-background/40 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                <span className="h-20 w-20 rounded-full bg-accent text-[var(--color-on-accent)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={28} aria-hidden="true" fill="currentColor" />
                </span>
              </div>
            </button>
          ) : (
            <iframe
              src={src}
              title={title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
        {externalLink && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2 bg-surface text-text-muted text-sm">
            <span className="font-mono">{title}</span>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-accent transition-colors underline-hover"
            >
              Open in new tab <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        )}
      </figure>
    </section>
  );
}

export default Demo;
