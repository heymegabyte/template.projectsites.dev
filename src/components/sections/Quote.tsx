import { Quote as QuoteIcon } from 'lucide-react';
import { JsonLd } from '@/components/JsonLd';
import { cn } from '@/lib/utils';
import { cdnImageProps } from '@/lib/cdn-image';

interface Props {
  /** The quoted text. */
  text: string;
  /** Person being quoted. */
  author: string;
  /** Author's role / title. */
  role?: string;
  /** Optional photo. */
  photo?: string;
  /** Optional URL to source (publication, podcast, post). */
  source?: { name: string; href: string };
  /** Section header / eyebrow. */
  eyebrow?: string;
  /** Emit a `Quotation` JSON-LD node for GEO. Default true. */
  jsonLd?: boolean;
  className?: string;
}

/**
 * Editorial pull-quote section (idea #62). Larger than testimonials,
 * intended for a single high-impact callout — the one quote that converts.
 *
 * Emits Schema.org `Quotation` JSON-LD when `jsonLd` is true — picked up by
 * Google AI Overviews and Perplexity for citation.
 */
export function Quote({ text, author, role, photo, source, eyebrow, jsonLd = true, className }: Props) {
  // Responsive + modern-format props for the author portrait: raw Unsplash `fm=jpg` URLs →
  // `auto=format` (AVIF/WebP) + a per-width srcSet. This is a small ~48px round portrait.
  // Additive (falls back to src); no-op for non-CDN URLs.
  const rimg = photo ? cdnImageProps(photo, '(max-width: 768px) 40vw, 160px') : null;
  return (
    <section className={cn('py-24 md:py-32 max-w-container-prose mx-auto px-6', className)}>
      {jsonLd && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Quotation',
            text,
            spokenByCharacter: {
              '@type': 'Person',
              name: author,
              ...(role ? { jobTitle: role } : {}),
              ...(photo ? { image: photo } : {}),
            },
            ...(source ? { citation: { '@type': 'CreativeWork', name: source.name, url: source.href } } : {}),
          }}
        />
      )}

      <figure className="reveal-on-view">
        {eyebrow && (
          <p className="text-accent text-sm font-mono tracking-widest uppercase text-center mb-6">{eyebrow}</p>
        )}
        <QuoteIcon
          aria-hidden="true"
          className="text-accent/40 mx-auto mb-6"
          size={48}
          strokeWidth={1.5}
        />
        <blockquote className="text-text font-heading text-3xl md:text-4xl font-medium leading-tight tracking-[-0.01em] text-center">
          <span className="text-balance">{text}</span>
        </blockquote>
        <figcaption className="mt-10 flex items-center justify-center gap-4">
          {photo && (
            <img
              src={rimg?.src ?? photo}
              srcSet={rimg?.srcSet}
              sizes={rimg?.sizes}
              alt=""
              loading="lazy"
              decoding="async"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover border border-border"
            />
          )}
          <div className="text-center">
            <p className="font-medium text-text">{author}</p>
            {role && <p className="text-text-muted text-sm">{role}</p>}
            {source && (
              <p className="text-text-subtle text-xs mt-1">
                <a
                  href={source.href}
                  target={source.href.startsWith('http') ? '_blank' : undefined}
                  rel={source.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="underline-hover hover:text-accent"
                >
                  {source.name}
                </a>
              </p>
            )}
          </div>
        </figcaption>
      </figure>
    </section>
  );
}

export default Quote;
