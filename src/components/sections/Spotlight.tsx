import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const visualNode =
    visual !== null && typeof visual === 'object' && 'src' in visual ? (
      <div className="relative card-tactile overflow-hidden rounded-2xl aspect-[5/4]">
        <img
          src={visual.src}
          alt={visual.alt}
          loading="lazy"
          decoding="async"
          width={1200}
          height={960}
          className="h-full w-full object-cover"
        />
      </div>
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
            {badge && (
              <span className="inline-flex items-center gap-1.5 text-accent text-xs font-mono tracking-widest uppercase mb-4 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 w-fit">
                <Sparkles size={12} />
                {badge}
              </span>
            )}
            {eyebrow && <p className="text-accent text-sm font-mono tracking-widest uppercase mb-4">{eyebrow}</p>}
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-text mb-4 text-balance">
              {headline}
            </h2>
            {description && <p className="text-text-muted text-lg leading-relaxed">{description}</p>}
            {(primary || secondary) && (
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {primary && (
                  <Button asChild size="lg">
                    <Link to={primary.href}>
                      {primary.label} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {secondary && (
                  <Button asChild size="lg" variant="outline">
                    <Link to={secondary.href}>{secondary.label}</Link>
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
          {badge && (
            <span className="inline-flex items-center gap-1.5 text-accent text-xs font-mono tracking-widest uppercase mb-4 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 w-fit">
              <Sparkles size={12} />
              {badge}
            </span>
          )}
          {eyebrow && (
            <p className="text-accent text-sm font-mono tracking-widest uppercase mb-4">{eyebrow}</p>
          )}
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-text mb-6 text-balance">
            {headline}
          </h2>
          {description && (
            <p className="text-text-muted text-lg leading-relaxed mb-6">{description}</p>
          )}
          {features && features.length > 0 && (
            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex gap-3 text-text-muted">
                  <span className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true">▸</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
          {(primary || secondary) && (
            <div className="flex flex-col sm:flex-row gap-3">
              {primary && (
                <Button asChild size="lg">
                  <Link to={primary.href}>
                    {primary.label} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {secondary && (
                <Button asChild size="lg" variant="outline">
                  <Link to={secondary.href}>{secondary.label}</Link>
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
