import { type CSSProperties } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { cn } from '@/lib/utils';

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  links?: { label: string; href: string }[];
}

interface Props {
  members: TeamMember[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  className?: string;
}

/**
 * TeamGrid — a named "meet the humans behind the work" credibility section (emits
 * Person JSON-LD for each member). Renders a photo/monogram + name + role + bio +
 * links card per person.
 *
 * Cinematic layer (all transform/opacity/filter-only — GPU-safe, no layout thrash —
 * and DOUBLE-gated behind `prefers-reduced-motion: no-preference` +
 * `prefers-reduced-data: no-preference`, mirroring the {@link TeamRoles} sibling; see
 * the `TEAM GRID` block in index.css): each card **stagger-rises** on scroll keyed on
 * the inline `--tm-i` (layered on `.reveal-on-view`), **lifts** on hover/focus-within,
 * grows a gradient **top-accent bar** that draws in + brightens (keyed on `--tm-lift`),
 * the **portrait slow-zooms** behind a fixed frame with an accent scrim, the ring warms
 * to accent, and the name shifts to accent. Under reduced-motion / reduced-data / no-JS
 * the resting base state shows every card fully legible with nothing hidden. Headline +
 * name use `clamp()` fluid type; colors are theme tokens + `--color-accent` only, so it
 * reads correctly on both light and dark verticals. Focus-visible rings are preserved on
 * every link.
 */
export function TeamGrid({
  members,
  eyebrow = 'Our team',
  headline = 'The humans behind the work',
  description,
  className,
}: Props) {
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <JsonLd
        data={members.map((m) => ({
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: m.name,
          jobTitle: m.role,
          image: m.photo,
          sameAs: m.links?.map((l) => l.href),
        }))}
      />
      <div className="text-center mb-16 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</span>
        <h2
          className="font-bold font-heading mt-4 mb-4 text-text text-balance tracking-[-0.02em]"
          style={{ fontSize: 'clamp(1.75rem, 3vw + 0.5rem, 3rem)', lineHeight: 1.1 }}
        >
          {headline}
        </h2>
        {description && <p className="text-text-muted max-w-2xl mx-auto text-lg text-pretty">{description}</p>}
      </div>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {members.map((m, i) => (
          <li
            key={`${m.name}-${i}`}
            style={{ '--tm-i': i } as CSSProperties}
            className="team-card card-tactile relative overflow-hidden reveal-on-view group transition-transform duration-300 hover:-translate-y-1 focus-within:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0"
          >
            {/* Gradient top-accent bar — draws in + brightens on hover/focus. Decorative,
                transform/opacity-only, motion-gated (keyed on --tm-lift). */}
            <span aria-hidden="true" className="team-card-bar pointer-events-none" />
            <div className="team-card-media relative aspect-square bg-surface-elevated overflow-hidden">
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={`Portrait of ${m.name}`}
                  loading="lazy"
                  decoding="async"
                  className="team-card-photo h-full w-full object-cover"
                />
              ) : (
                <div className="team-card-photo h-full w-full flex items-center justify-center text-6xl font-heading font-extrabold text-accent/30">
                  {m.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join('')}
                </div>
              )}
              {/* Accent scrim — warms in from the bottom on hover/focus for depth. */}
              <span aria-hidden="true" className="team-card-scrim pointer-events-none absolute inset-0" />
            </div>
            <div className="p-6">
              <h3
                className="team-card-name font-heading font-bold text-text"
                style={{ fontSize: 'clamp(1.125rem, 1rem + 0.5vw, 1.35rem)' }}
              >
                {m.name}
              </h3>
              <p className="text-accent text-sm font-mono">{m.role}</p>
              {m.bio && <p className="mt-3 text-text-muted text-sm leading-relaxed">{m.bio}</p>}
              {m.links && m.links.length > 0 && (
                <ul className="mt-4 flex gap-3 flex-wrap">
                  {m.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target={l.href.startsWith('http') ? '_blank' : undefined}
                        rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="text-text-muted hover:text-accent text-sm underline-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TeamGrid;
