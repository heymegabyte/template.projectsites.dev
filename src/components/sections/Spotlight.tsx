import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cdnImageProps } from '@/lib/cdn-image';
import { scrubText, scrubList, scrubImage } from '@/lib/placeholders';

interface Props {
  /** Eyebrow / label above the headline. */
  eyebrow?: string;
  /** Bold spotlight headline. */
  headline: string;
  /** Supporting copy under headline. */
  description?: string;
  /** Big primary visual — image or custom node. */
  visual: ReactNode | { src: string; alt: string };
  /** Layout: 'split' (image left, copy right) or 'overlay' (text over image). */
  variant?: 'split' | 'overlay';
  /** Position of the image in `split` mode. */
  imagePosition?: 'left' | 'right';
  /** Primary call-to-action. */
  primary?: { label: string; href: string };
  /** Secondary CTA. */
  secondary?: { label: string; href: string };
  /** Optional 3-4 short bullet points. */
  features?: string[];
  /** Optional small badge text in the corner of the visual. */
  badge?: string;
  className?: string;
}

/**
 * Spotlight section (idea #63) — single dominant product/feature focal point.
 * Replaces a BentoGrid when one item should command 80% of the section weight.
 *
 * Two variants:
 *   - `split` (default): image on one side, copy on the other
 *   - `overlay`: image full-width with copy floated over (good for hero-style splash)
 */
export function Spotlight({
  eyebrow,
  headline,
  description,
  visual,
  variant = 'split',
  imagePosition = 'right',
  primary,
  secondary,
  features,
  badge,
  className,
}: Props) {
  // Placeholder firewall (mirrors LogoCloud/Timeline): a leaked `{SPOTLIGHT_*}`
  // token never renders. Text props scrub to '' (the guards below then hide the
  // element), token features are dropped, a token image `src` renders NO <img>
  // (never a 404 box), and a CTA with a token label/href is dropped entirely —
  // a dead "{CTA_LABEL}" button must never ship.
  const safeEyebrow = scrubText(eyebrow);
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  const safeBadge = scrubText(badge);
  const safeFeatures = scrubList(features);
  const safeCta = (cta?: { label: string; href: string }): { label: string; href: string } | undefined => {
    if (!cta) return undefined;
    const label = scrubText(cta.label);
    const href = scrubText(cta.href);
    return label && href ? { label, href } : undefined;
  };
  const safePrimary = safeCta(primary);
  const safeSecondary = safeCta(secondary);

  const isImageVisual =
    visual !== null && typeof visual === 'object' && 'src' in visual;
  const safeImage = isImageVisual ? scrubImage(visual, safeHeadline) : undefined;
  // Image-beside-text (~2-col) → responsive, modern-format srcSet (no-op on local URLs).
  const rimg = safeImage ? cdnImageProps(safeImage.src, '(max-width: 1024px) 100vw, 50vw') : null;
  const visualNode = isImageVisual ? (
    safeImage ? (
      <div className="relative card-tactile overflow-hidden rounded-2xl aspect-[5/4]">
        <img
          src={rimg?.src ?? safeImage.src}
          srcSet={rimg?.srcSet}
          sizes={rimg?.sizes}
          alt={safeImage.alt}
          loading="lazy"
          decoding="async"
          width={1200}
          height={960}
          className="h-full w-full object-cover"
        />
      </div>
    ) : null
  ) : (
    visual
  );

  if (variant === 'overlay') {
    return (
      <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
        <div className="relative card-tactile overflow-hidden rounded-3xl min-h-[480px] reveal-on-view">
          <div className="absolute inset-0">{visualNode}</div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="relative z-10 max-w-xl p-8 md:p-16 flex flex-col justify-end h-full">
            {safeBadge && (
              <span className="inline-flex items-center gap-1.5 text-accent text-xs font-mono tracking-widest uppercase mb-4 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 w-fit">
                <Sparkles size={12} />
                {safeBadge}
              </span>
            )}
            {safeEyebrow && <p className="text-accent text-sm font-mono tracking-widest uppercase mb-4">{safeEyebrow}</p>}
            {safeHeadline && (
              <h2 className="text-4xl md:text-5xl font-bold font-heading text-text mb-4 text-balance">
                {safeHeadline}
              </h2>
            )}
            {safeDescription && <p className="text-text-muted text-lg leading-relaxed">{safeDescription}</p>}
            {(safePrimary || safeSecondary) && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {safePrimary && (
                  <Button asChild size="lg">
                    <Link to={safePrimary.href}>
                      {safePrimary.label} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {safeSecondary && (
                  <Button asChild size="lg" variant="outline">
                    <Link to={safeSecondary.href}>{safeSecondary.label}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  const flip = imagePosition === 'left';

  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <div className={cn('grid lg:grid-cols-2 gap-12 items-center', flip && 'lg:[&>*:first-child]:order-2')}>
        <div className="reveal-on-view">
          {safeBadge && (
            <span className="inline-flex items-center gap-1.5 text-accent text-xs font-mono tracking-widest uppercase mb-4 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 w-fit">
              <Sparkles size={12} />
              {safeBadge}
            </span>
          )}
          {safeEyebrow && (
            <p className="text-accent text-sm font-mono tracking-widest uppercase mb-4">{safeEyebrow}</p>
          )}
          {safeHeadline && (
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-text mb-6 text-balance">
              {safeHeadline}
            </h2>
          )}
          {safeDescription && (
            <p className="text-text-muted text-lg leading-relaxed mb-6">{safeDescription}</p>
          )}
          {safeFeatures.length > 0 && (
            <ul className="space-y-3 mb-8">
              {safeFeatures.map((f, i) => (
                <li key={i} className="flex gap-3 text-text-muted">
                  <span className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true">▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {(safePrimary || safeSecondary) && (
            <div className="flex flex-col sm:flex-row gap-3">
              {safePrimary && (
                <Button asChild size="lg">
                  <Link to={safePrimary.href}>
                    {safePrimary.label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {safeSecondary && (
                <Button asChild size="lg" variant="outline">
                  <Link to={safeSecondary.href}>{safeSecondary.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="reveal-on-view">{visualNode}</div>
      </div>
    </section>
  );
}

export default Spotlight;
