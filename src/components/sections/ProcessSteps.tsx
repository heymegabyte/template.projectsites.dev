import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { scrubText } from '@/lib/placeholders';

export interface ProcessStep {
  title: string;
  description: string;
  icon?: ReactNode;
}

interface Props {
  steps: ProcessStep[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  className?: string;
  /**
   * Scroll-stacking DECK variant (`scroll_stack` flag) — render the steps as a vertical column of
   * sticky cards that pin + recede as you scroll (Apple / Awwwards "cards stack"), instead of the
   * horizontal grid. Off by default → byte-for-byte the existing grid. The pin + recede is CSS-only
   * (`.process-steps.ps-scroll-stack`), reduced-motion / mobile / no-`animation-timeline` safe.
   */
  stack?: boolean;
}

/**
 * Numbered process steps with an animated connector rail. Three-or-more steps
 * form a horizontal flow on md+, a vertical timeline below. Each step is a
 * tactile card that rises into view in sequence; a glowing rail draws through
 * flow-node waypoints and each editorial ghost number scale-pops — all keyed on
 * the inline `--step-i` cascade. Motion is `prefers-reduced-motion`-gated; the
 * resting base state (no-JS / reduced-motion) is fully drawn + legible.
 */
export function ProcessSteps({ steps, eyebrow = 'How it works', headline, description, className, stack = false }: Props) {
  const safeEyebrow = scrubText(eyebrow, 'How it works');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  // Drop steps whose title is an unresolved token; scrub each description.
  const safeSteps = steps
    .map((s) => ({ ...s, title: scrubText(s.title), description: scrubText(s.description) }))
    .filter((s) => s.title.length > 0);
  if (safeSteps.length === 0) return null;
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <div className="text-center mb-16 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">
            {safeHeadline}
          </h2>
        )}
        {safeDescription && <p className="text-text-muted max-w-2xl mx-auto text-lg">{safeDescription}</p>}
      </div>

      <ol
        className={cn(
          'process-steps relative gap-6',
          stack ? 'ps-scroll-stack' : 'grid md:grid-cols-3 lg:grid-cols-4',
        )}
      >
        {/* Connector line linking the steps into a flow (md+ horizontal row). Only in the GRID
            layout — the vertical scroll-stack deck has no horizontal rail. The base rail is fully
            drawn (no-JS / reduced-motion renders it solid); a second overlay rail (process-connector)
            draws left→right on scroll with a soft glow "comet" head. */}
        {!stack && (
          <>
            <span
              aria-hidden="true"
              className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent"
            />
            <span
              aria-hidden="true"
              className="process-connector hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-accent/60 via-primary/60 to-info/60"
            />
          </>
        )}
        {safeSteps.map((step, i) => (
          <li
            key={step.title}
            style={{ '--step-i': i } as CSSProperties}
            className="process-step relative card-tactile p-6 md:p-8 transition-transform duration-300 hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            {/* Flow waypoint — a filled node sitting on the connector rail, one
                per step, that scale-pops in with the connector draw (staggered by
                --step-i) and carries a soft accent halo. Decorative; hidden on the
                stacked mobile layout where the horizontal rail isn't shown. */}
            <span
              aria-hidden="true"
              className="process-node hidden md:block absolute -top-[calc(2rem+3px)] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent ring-4 ring-accent/15"
            />
            {/* Editorial ghost number — a faint watermark in the TOP-RIGHT corner so it
                never collides with the icon + title in the top-LEFT (it was `-left-2`,
                overlapping the icon). Decorative + behind the content (earlier in DOM),
                staggered scale-pop keyed on --step-i. Fluid clamp() size scales it
                with the viewport without a media-query step. */}
            <span
              aria-hidden="true"
              className="process-num pointer-events-none select-none absolute -top-4 right-3 font-heading font-extrabold text-accent/15 leading-none"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="relative">
              {step.icon && (
                <div className="process-icon h-12 w-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                  {step.icon}
                </div>
              )}
              <h3 className="font-heading text-xl font-bold text-text mb-2">{step.title}</h3>
              {step.description && <p className="text-text-muted text-sm leading-relaxed">{step.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default ProcessSteps;
