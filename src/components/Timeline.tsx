import { AnimatedSection } from './AnimatedSection';

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
  link?: { href: string; label: string };
}

interface Props {
  events: TimelineEvent[];
  headline?: string;
  eyebrow?: string;
}

/**
 * Vertical event timeline with a cinematic accent spine. The gradient spine
 * *draws* top-to-bottom as the list scrolls into view (`view()` scroll-timeline,
 * feature-detected), each entry blur-rises on a staggered delay, and every node
 * dot carries an accent ring with a soft settle-pulse. All motion is gated behind
 * `prefers-reduced-motion: no-preference` — with motion off (or on browsers
 * without scroll-timeline) the spine is fully drawn and every entry is visible,
 * so the record stays perfectly readable. Theme tokens only, so it reads on light
 * (healthcare/wellness) and dark (SaaS/agency) verticals alike.
 */
export default function Timeline({ events, headline, eyebrow }: Props) {
  if (events.length === 0) return null;
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        {(eyebrow || headline) && (
          <div className="text-center mb-12">
            {eyebrow && (
              <span className="text-accent text-sm font-mono tracking-widest uppercase">
                {eyebrow}
              </span>
            )}
            {headline && (
              <h2
                className="font-bold font-heading mt-4"
                style={{ fontSize: 'clamp(1.75rem, 1.1rem + 3vw, 3rem)', textWrap: 'balance' }}
              >
                {headline}
              </h2>
            )}
          </div>
        )}
        {/* `.timeline` hosts the drawn accent spine (::before) behind the entries. */}
        <ol className="timeline relative pl-8 space-y-10" role="list">
          {events.map((e, i) => (
            <AnimatedSection key={`${e.year}-${i}`} delay={`${i * 0.1}s`}>
              <li className="timeline-item relative" style={{ ['--tl-i' as string]: i }}>
                <span
                  aria-hidden="true"
                  className="timeline-dot absolute -left-[37px] top-1.5 h-3.5 w-3.5 rounded-full bg-[var(--color-accent)] ring-4 ring-background"
                />
                <time className="text-accent font-mono text-sm tracking-widest">
                  {e.year}
                </time>
                <h3
                  className="font-bold text-text mt-1 mb-2 font-heading"
                  style={{ fontSize: 'clamp(1.125rem, 0.95rem + 0.75vw, 1.375rem)', textWrap: 'balance' }}
                >
                  {e.title}
                </h3>
                <p className="text-text-muted leading-relaxed" style={{ textWrap: 'pretty' }}>
                  {e.description}
                </p>
                {e.link && (
                  <a
                    href={e.link.href}
                    className="inline-block mt-3 text-sm text-[var(--color-accent)] hover:underline underline-offset-4"
                    {...(e.link.href.startsWith('http')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {e.link.label} →
                  </a>
                )}
              </li>
            </AnimatedSection>
          ))}
        </ol>
      </div>
    </section>
  );
}
