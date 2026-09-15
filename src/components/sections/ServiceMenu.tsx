import { brand } from '@/brand';
import { JsonLd } from '@/components/JsonLd';
import { scrubText } from '@/lib/placeholders';
import { cn } from '@/lib/utils';

export interface ServiceEntry {
  name: string;
  description?: string;
  /** Display price, e.g. "$45" or "From $120". */
  price?: string;
  /** Duration label, e.g. "45 min". */
  duration?: string;
}

export interface ServiceCategory {
  name: string;
  services: ServiceEntry[];
}

interface Props {
  categories: ServiceCategory[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  /** Booking link — Cal.com / Calendly / Square. Falls back to the brand phone. */
  bookUrl?: string;
  className?: string;
}

function priceNumber(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.replace(/,/g, '').match(/\d+(?:\.\d{1,2})?/);
  return m ? m[0] : null;
}

/**
 * Categorized service + price + duration list for appointment businesses —
 * salons, spas, barbers, trades, auto, and professional services (distinct from
 * the SaaS `Pricing` tiers). Each service shows a name, blurb, duration, and
 * price, with a tracked "Book" CTA (falls back to a click-to-call `tel:` link).
 * Scrubs tokens, drops empty rows, returns `null` when nothing real survives.
 * Emits `OfferCatalog` JSON-LD (`Offer` → `Service`) so each service is indexable.
 */
export function ServiceMenu({
  categories,
  eyebrow = 'Services',
  headline,
  description,
  bookUrl,
  className,
}: Props) {
  const safeEyebrow = scrubText(eyebrow, 'Services');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  const safeBook = scrubText(bookUrl);
  const phone = scrubText(brand.business.phone);
  const cta = safeBook || (phone ? `tel:${phone.replace(/[^+\d]/g, '')}` : '');
  const ctaKind = safeBook ? 'book' : 'call';

  const safeCategories = (categories ?? [])
    .map((c) => ({
      name: scrubText(c.name),
      services: (c.services ?? [])
        .map((s) => ({
          name: scrubText(s.name),
          description: scrubText(s.description),
          price: scrubText(s.price),
          duration: scrubText(s.duration),
        }))
        .filter((s) => s.name.length > 0),
    }))
    .filter((c) => c.services.length > 0);

  if (safeCategories.length === 0) return null;

  const catalogLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `${brand.business.name} Services`,
    itemListElement: safeCategories.flatMap((c) =>
      c.services.map((s) => {
        const num = priceNumber(s.price);
        return {
          '@type': 'Offer',
          ...(num ? { price: num, priceCurrency: 'USD' } : {}),
          itemOffered: {
            '@type': 'Service',
            name: s.name,
            ...(s.description ? { description: s.description } : {}),
            ...(c.name ? { category: c.name } : {}),
            provider: { '@type': 'LocalBusiness', name: brand.business.name },
          },
        };
      }),
    ),
  };

  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <JsonLd data={catalogLd} />
      <div className="text-center mb-16 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{safeHeadline}</h2>
        )}
        {safeDescription && <p className="text-text-muted max-w-2xl mx-auto text-lg">{safeDescription}</p>}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {safeCategories.map((c) => (
          <div key={c.name || c.services[0].name} className="card-tactile p-6 md:p-8 reveal-on-view">
            {c.name && (
              <h3 className="font-heading text-xl font-bold text-text mb-6 pb-3 border-b border-border">{c.name}</h3>
            )}
            <ul className="space-y-5">
              {c.services.map((s) => (
                <li key={s.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-heading font-semibold text-text">{s.name}</span>
                    {s.price && <span className="shrink-0 font-mono text-sm text-accent">{s.price}</span>}
                  </div>
                  {(s.description || s.duration) && (
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">
                      {s.description}
                      {s.description && s.duration ? ' · ' : ''}
                      {s.duration && <span className="font-mono text-xs uppercase tracking-wide">{s.duration}</span>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {cta && (
        <div className="mt-12 text-center reveal-on-view">
          <a
            href={cta}
            data-bcl={ctaKind}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-8 py-3 font-mono text-sm font-semibold uppercase tracking-widest text-[var(--color-on-accent)] transition-transform hover:-translate-y-0.5"
          >
            {ctaKind === 'book' ? 'Book an appointment' : 'Call to book'}
          </a>
        </div>
      )}
    </section>
  );
}

export default ServiceMenu;
