import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { scrubText } from '@/lib/placeholders';
import { ScrambleText } from '@/components/ScrambleText';
import { PointerSpotlight } from '@/components/PointerSpotlight';

interface Props {
  headline: string;
  description?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  eyebrow?: string;
  /** Tone: emphatic uses gradient bg; quiet uses card-tactile. */
  tone?: 'emphatic' | 'quiet';
  className?: string;
}

export function CTASection({
  headline,
  description,
  primary,
  secondary,
  eyebrow,
  tone = 'emphatic',
  className,
}: Props) {
  // CTA is a conversion anchor — keep a real headline even if the token was
  // unresolved. Labels fall back to sensible verbs so the buttons still act.
  const safeHeadline = scrubText(headline, 'Ready to get started?');
  const safeEyebrow = scrubText(eyebrow);
  const safeDescription = scrubText(description);
  const primaryLabel = primary ? scrubText(primary.label, 'Get in touch') : '';
  const secondaryLabel = secondary ? scrubText(secondary.label) : '';
  return (
    <section className={cn('py-20 md:py-28 max-w-container-normal mx-auto px-6', className)}>
      <div
        className={cn(
          'relative overflow-hidden text-center p-12 md:p-20 rounded-3xl reveal-on-view',
          tone === 'emphatic'
            ? 'bg-gradient-to-br from-primary/20 via-accent/10 to-background border border-accent/20 shadow-glow'
            : 'card-tactile'
        )}
      >
        {tone === 'emphatic' && (
          <>
            <div aria-hidden="true" className="absolute inset-0 grain pointer-events-none" />
            {/* Drifting aurora glows behind the closing CTA — cinematic depth, motion-gated. */}
            <div aria-hidden="true" className="cta-glow-1 pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
            <div aria-hidden="true" className="cta-glow-2 pointer-events-none absolute -right-16 -bottom-20 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
            {/* Cursor-reactive ambient spotlight — interactive depth the auto-drifting glows lack.
                Transform-only + rAF-throttled + (pointer:fine)/reduced-motion gated (static glow otherwise). */}
            <PointerSpotlight />
          </>
        )}
        <div className="relative z-10">
          {safeEyebrow && (
            <span className="text-accent text-sm font-mono tracking-widest uppercase"><ScrambleText text={safeEyebrow} /></span>
          )}
          <h2 className="mt-4 text-3xl md:text-5xl font-bold font-heading text-text">
            <span className={tone === 'emphatic' ? 'gradient-text' : ''}>{safeHeadline}</span>
          </h2>
          {safeDescription && (
            <p className="mt-6 text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">{safeDescription}</p>
          )}
          {(primary || (secondary && secondaryLabel)) && (
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {primary && (
                <Button asChild size="xl">
                  <Link to={primary.href}>
                    {primaryLabel} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              {secondary && secondaryLabel && (
                <Button asChild size="xl" variant="outline">
                  <Link to={secondary.href}>{secondaryLabel}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default CTASection;
