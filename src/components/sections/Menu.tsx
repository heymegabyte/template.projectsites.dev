import { brand } from '@/brand';
import { JsonLd } from '@/components/JsonLd';
import { hasRealImage, scrubList, scrubText } from '@/lib/placeholders';
import { cn } from '@/lib/utils';

export interface MenuEntry {
  name: string;
  description?: string;
  /** Display price as written by the generation step, e.g. "$14" or "14". */
  price?: string;
  /** Dietary / prep tags rendered as pills, e.g. ["Vegan", "GF"]. */
  tags?: string[];
  image?: string;
}

export interface MenuCategory {
  name: string;
  items: MenuEntry[];
}

interface Props {
  categories: MenuCategory[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  /** Optional link to a full/downloadable menu — renders a tracked CTA. */
  menuUrl?: string;
  className?: string;
}

/** Pull the leading numeric out of a price string ("$14.50" → "14.50") for JSON-LD offers. */
function priceNumber(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.replace(/,/g, '').match(/\d+(?:\.\d{1,2})?/);
  return m ? m[0] : null;
}

/**
 * Categorized food/drink menu for restaurants, cafés, bars, and bakeries.
 * Each category is a card of items with an aligned price, dietary-tag pills, and
 * an optional dish photo. Unresolved generation tokens are scrubbed, empty items
 * dropped, and the whole section returns `null` when no real items survive.
 * Emits `Menu` JSON-LD (with `hasMenuSection` → `MenuItem` + `Offer`) so search
 * engines index the actual dishes + prices. Use for any food-and-beverage vertical.
 */
export function Menu({ categories, eyebrow = 'Menu', headline, description, menuUrl, className }: Props) {
  const safeEyebrow = scrubText(eyebrow, 'Menu');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  const safeUrl = scrubText(menuUrl);

  const safeCategories = (categories ?? [])
    .map((c) => ({
      name: scrubText(c.name),
      items: (c.items ?? [])
        .map((it) => ({
          name: scrubText(it.name),
          description: scrubText(it.description),
          price: scrubText(it.price),
          tags: scrubList(it.tags),
          image: hasRealImage(it.image) ? it.image : undefined,
        }))
        .filter((it) => it.name.length > 0),
    }))
    .filter((c) => c.items.length > 0);

  if (safeCategories.length === 0) return null;

  const menuLd = {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${brand.business.name} Menu`,
    hasMenuSection: safeCategories.map((c) => ({
      '@type': 'MenuSection',
      name: c.name || undefined,
      hasMenuItem: c.items.map((it) => {
        const num = priceNumber(it.price);
        return {
          '@type': 'MenuItem',
          name: it.name,
          ...(it.description ? { description: it.description } : {}),
          ...(num ? { offers: { '@type': 'Offer', price: num, priceCurrency: 'USD' } } : {}),
        };
      }),
    })),
  };

  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <JsonLd data={menuLd} />
      <div className="text-center mb-16 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{safeHeadline}</h2>
        )}
        {safeDescription && <p className="text-text-muted max-w-2xl mx-auto text-lg">{safeDescription}</p>}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {safeCategories.map((c) => (
          <div key={c.name || c.items[0].name} className="card-tactile p-6 md:p-8 reveal-on-view">
            {c.name && (
              <h3 className="font-heading text-xl font-bold text-text mb-6 pb-3 border-b border-border">{c.name}</h3>
            )}
            <ul className="space-y-5">
              {c.items.map((it) => (
                <li key={it.name} className="flex gap-4">
                  {it.image && (
                    <img
                      src={it.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-heading font-semibold text-text">{it.name}</span>
                      {it.price && (
                        <span className="shrink-0 font-mono text-sm text-accent">{it.price}</span>
                      )}
                    </div>
                    {it.description && (
                      <p className="mt-1 text-sm text-text-muted leading-relaxed">{it.description}</p>
                    )}
                    {it.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {it.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wide text-accent"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {safeUrl && (
        <div className="mt-12 text-center reveal-on-view">
          <a
            href={safeUrl}
            data-bcl="menu-view"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-6 py-2.5 font-mono text-sm uppercase tracking-widest text-text transition-colors hover:border-accent hover:text-accent"
          >
            View full menu
          </a>
        </div>
      )}
    </section>
  );
}

export default Menu;
