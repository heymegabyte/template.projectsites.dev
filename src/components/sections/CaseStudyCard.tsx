import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { isPlaceholder } from '@/lib/placeholders';
import { cdnImageProps } from '@/lib/cdn-image';

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  summary: string;
  industry?: string;
  metrics?: { value: string; label: string }[];
  cover?: string;
}

interface Props {
  studies: CaseStudy[];
  eyebrow?: string;
  headline?: string;
  className?: string;
  basePath?: string;
}

export function CaseStudyGrid({ studies, eyebrow, headline, className, basePath = '/case-studies' }: Props) {
  // Drop unfilled `{CS_N_*}` slot cards — a business with fewer case studies than the template's
  // slots would otherwise render a broken/empty card (build_validators only guards {BUSINESS_*}, not
  // section slots). If NONE are filled (the raw template skeleton / unit fixtures), keep all so the
  // dev build still renders. Uses the isPlaceholder firewall (placeholders.ts).
  const filled = studies.filter((s) => !isPlaceholder(s.title));
  const shown = filled.length > 0 ? filled : studies;
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      {(eyebrow || headline) && (
        <div className="text-center mb-12 reveal-on-view">
          {eyebrow && <span className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</span>}
          {headline && (
            <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 text-text">{headline}</h2>
          )}
        </div>
      )}
      <ul className="grid md:grid-cols-2 gap-8">
        {shown.map((s) => {
          // Responsive + modern-format props for the card cover: raw Unsplash `fm=jpg` full-width
          // URLs → `auto=format` (AVIF/WebP) + a per-width srcSet. Cards are ~1/2 the grid ≥md,
          // full-width on phone. Additive (falls back to src); no-op for non-CDN URLs.
          const rimg = s.cover
            ? cdnImageProps(s.cover, '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
            : null;
          return (
          <li key={s.slug}>
            <Link
              to={`${basePath}/${s.slug}`}
              className="group block card-tactile overflow-hidden interactive-4 h-full"
            >
              {s.cover && (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={rimg?.src ?? s.cover}
                    srcSet={rimg?.srcSet}
                    sizes={rimg?.sizes}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-slow"
                  />
                </div>
              )}
              <div className="p-8">
                {s.industry && (
                  <span className="text-accent font-mono text-xs uppercase tracking-widest">{s.industry}</span>
                )}
                <h3 className="mt-2 font-heading text-2xl font-bold text-text underline-hover inline-block">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-text-subtle">Client: {s.client}</p>
                <p className="mt-4 text-text-muted leading-relaxed">{s.summary}</p>
                {s.metrics && (
                  <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                    {s.metrics.slice(0, 3).map((m) => (
                      <div key={m.label}>
                        <dt className="text-xs text-text-subtle uppercase tracking-wider">{m.label}</dt>
                        <dd className="mt-1 font-heading text-2xl font-bold gradient-text">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CaseStudyGrid;
