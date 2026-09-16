import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { scrubText, scrubList, scrubImage } from '@/lib/placeholders';
import { clipRevealEnabled } from '@/lib/featureFlags';

interface Props {
  eyebrow?: string;
  headline: string;
  description: string;
  bullets?: string[];
  image?: { src: string; alt: string };
  visual?: ReactNode;
  cta?: { label: string; href: string };
  imagePosition?: 'left' | 'right';
  className?: string;
}

/**
 * Image-left / image-right feature split. Pass either `image` for an `<img>`,
 * or pass `visual` for fully custom content (chart, demo, code block).
 */
export function FeatureSplit({
  eyebrow,
  headline,
  description,
  bullets = [],
  image,
  visual,
  cta,
  imagePosition = 'right',
  className,
}: Props) {
  const flip = imagePosition === 'left';
  // Scrub unresolved generation tokens so a raw `{ABOUT_HEADLINE}` /
  // `{ABOUT_DESCRIPTION}` never renders and a `{ABOUT_IMAGE_URL}` never 404s.
  // Empty → the guards below hide the element; a placeholder image → no <img>.
  const safeEyebrow = scrubText(eyebrow);
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  const safeBullets = scrubList(bullets);
  const safeImage = scrubImage(image);
  // Nothing real to show on the copy side AND no headline → skip the whole
  // section rather than render an empty husk (SafeSection-style fail-soft).
  if (!safeHeadline && !safeDescription && safeBullets.length === 0 && !visual && !safeImage) {
    return null;
  }
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <div className={cn('grid lg:grid-cols-2 gap-12 items-center', flip && 'lg:[&>*:first-child]:order-2')}>
        <div className="reveal-on-view">
          {safeEyebrow && (
            <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
          )}
          {safeHeadline && (
            <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-6 text-text">
              {safeHeadline}
            </h2>
          )}
          {safeDescription && (
            <p className="text-text-muted text-lg leading-relaxed mb-6">{safeDescription}</p>
          )}
          {safeBullets.length > 0 && (
            <ul className="space-y-3 mb-8">
              {safeBullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-text-muted">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {cta && scrubText(cta.label) && (
            <Button asChild variant="outline">
              <Link to={cta.href}>
                {scrubText(cta.label)} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        <div className="reveal-on-view">
          {visual ? (
            visual
          ) : safeImage ? (
            <div className="relative">
              {/* Soft OKLCH accent aura for cinematic depth behind the framed image. */}
              <span
                aria-hidden="true"
                className="feature-visual-aura pointer-events-none absolute -inset-5 -z-10 rounded-[2rem]"
              />
              <div
                data-clip-reveal={clipRevealEnabled() ? '1' : undefined}
                className={cn(
                  'group card-tactile overflow-hidden rounded-2xl aspect-[4/3] relative ring-1 ring-border transition-all duration-500 hover:ring-2 hover:ring-accent/40 motion-reduce:transition-none',
                  clipRevealEnabled() && 'ps-clip-reveal',
                )}
              >
                {/* Ken-Burns "living imagery": the wrapper slow-zooms on scroll (view-timeline);
                    the img keeps its hover-scale — nested transforms compose, no conflict. */}
                <div className="ps-ken-burns h-full w-full">
                  <img
                    src={safeImage.src}
                    alt={safeImage.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default FeatureSplit;
