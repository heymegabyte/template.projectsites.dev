import { brand } from '@/brand';
import { JsonLd } from '@/components/JsonLd';
import { TiltCard } from '@/components/TiltCard';
import { cdnImageProps } from '@/lib/cdn-image';
import { hasRealImage, scrubText } from '@/lib/placeholders';
import { cn } from '@/lib/utils';

export interface CollectionItem {
  name: string;
  /** Display price, e.g. "$48". */
  price?: string;
  image?: string;
  /** Product / detail link. */
  href?: string;
  /** Corner badge, e.g. "New", "Staff pick", "Limited". */
  badge?: string;
}

interface Props {
  items: CollectionItem[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  /** "Shop all" link rendered as a tracked CTA below the grid. */
  shopUrl?: string;
  className?: string;
}

function priceNumber(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.replace(/,/g, '').match(/\d+(?:\.\d{1,2})?/);
  return m ? m[0] : null;
}

/**
 * Featured product / collection grid for retail — jewelers, boutiques,
 * bookstores, record shops, outdoor outfitters, plant shops. Each card shows a
 * product image, name, price, and an optional corner badge, linking to the
 * product (or a shared shop link) with a tracked click. Scrubs tokens, drops
 * nameless items, and returns `null` when nothing real survives. Emits
 * `ItemList` → `Product` JSON-LD (with `Offer` price) so the catalog is indexable.
 * Use for any storefront that showcases goods.
 */
export function FeaturedCollection({
  items,
  eyebrow = 'Featured',
  headline,
  description,
  shopUrl,
  className,
}: Props) {
  const safeEyebrow = scrubText(eyebrow, 'Featured');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  const safeShop = scrubText(shopUrl);

  const safeItems = (items ?? [])
    .map((it) => ({
      name: scrubText(it.name),
      price: scrubText(it.price),
      badge: scrubText(it.badge),
      image: hasRealImage(it.image) ? it.image : undefined,
      href: scrubText(it.href) || safeShop,
    }))
    .filter((it) => it.name.length > 0);

  if (safeItems.length === 0) return null;

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${brand.business.name} — ${safeHeadline || 'Featured'}`,
    itemListElement: safeItems.map((it, i) => {
      const num = priceNumber(it.price);
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: it.name,
          ...(it.image ? { image: it.image } : {}),
          ...(it.href ? { url: it.href } : {}),
          ...(num ? { offers: { '@type': 'Offer', price: num, priceCurrency: 'USD', availability: 'https://schema.org/InStock' } } : {}),
        },
      };
    }),
  };

  const Card = ({ it }: { it: (typeof safeItems)[number] }) => {
    // Responsive + modern-format props for the product photo. 2→3→4-col card grid.
    // Additive (falls back to src); no-op for non-CDN URLs.
    const rimg = it.image
      ? cdnImageProps(it.image, '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
      : null;
    return (
    <>
      <TiltCard className="relative aspect-square overflow-hidden rounded-xl bg-accent/5" max={7}>
        {it.image ? (
          <img
            src={rimg?.src ?? it.image}
            srcSet={rimg?.srcSet}
            sizes={rimg?.sizes}
            alt=""
            width={600}
            height={600}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div aria-hidden="true" className="h-full w-full bg-gradient-to-br from-accent/10 to-primary/10" />
        )}
        {it.badge && (
          <span
            data-tilt-layer
            className="absolute left-3 top-3 z-10 rounded-full bg-accent px-2.5 py-1 text-[11px] font-mono uppercase tracking-wide text-[var(--color-on-accent)]"
          >
            {it.badge}
          </span>
        )}
      </TiltCard>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-heading font-semibold text-text group-hover:text-accent transition-colors">
          {it.name}
        </span>
        {it.price && <span className="shrink-0 font-mono text-sm text-accent">{it.price}</span>}
      </div>
    </>
    );
  };

  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      <JsonLd data={listLd} />
      <div className="text-center mb-16 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{safeHeadline}</h2>
        )}
        {safeDescription && <p className="text-text-muted max-w-2xl mx-auto text-lg">{safeDescription}</p>}
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {safeItems.map((it, i) =>
          it.href ? (
            <a
              key={`${it.name}-${i}`}
              href={it.href}
              data-bcl="product-view"
              className="group reveal-on-view"
            >
              <Card it={it} />
            </a>
          ) : (
            <div key={`${it.name}-${i}`} className="group reveal-on-view">
              <Card it={it} />
            </div>
          ),
        )}
      </div>

      {safeShop && (
        <div className="mt-12 text-center reveal-on-view">
          <a
            href={safeShop}
            data-bcl="shop-all"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-6 py-2.5 font-mono text-sm uppercase tracking-widest text-text transition-colors hover:border-accent hover:text-accent"
          >
            Shop all
          </a>
        </div>
      )}
    </section>
  );
}

export default FeaturedCollection;
