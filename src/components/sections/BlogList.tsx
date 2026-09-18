import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { cdnImageProps } from '@/lib/cdn-image';

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author?: string;
  category?: string;
  cover?: string;
  readMinutes?: number;
}

interface Props {
  posts: BlogPostSummary[];
  eyebrow?: string;
  headline?: string;
  className?: string;
  /** Path prefix for post links. Default `/blog`. */
  basePath?: string;
  /** Heading level for the headline — 'h1' for the FIRST section on a section-only
   *  page (FAQ/Pricing/Blog) so the page has exactly one h1. Default 'h2'. */
  as?: 'h1' | 'h2';
}

export function BlogList({ posts, eyebrow, headline, className, basePath = '/blog', as = 'h2' }: Props) {
  if (!posts.length) return null;
  const [hero, ...rest] = posts;
  const Heading = as;
  // Responsive + modern-format props for the featured/lead cover photo (large: full-width on
  // phone, ~66vw beside the text on desktop). Additive (falls back to src); no-op for non-CDN URLs.
  const heroImg = hero.cover
    ? cdnImageProps(hero.cover, '(max-width: 1024px) 100vw, 66vw')
    : null;
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      {(eyebrow || headline) && (
        <div className="text-center mb-12 reveal-on-view">
          {eyebrow && <span className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</span>}
          {headline && (
            <Heading className="text-3xl md:text-5xl font-bold font-heading mt-4 text-text">{headline}</Heading>
          )}
        </div>
      )}

      <Link
        to={`${basePath}/${hero.slug}`}
        className="block reveal-on-view group card-tactile overflow-hidden mb-10 interactive-4"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {hero.cover && (
            <div className="aspect-video md:aspect-auto overflow-hidden">
              <img
                src={heroImg?.src ?? hero.cover}
                srcSet={heroImg?.srcSet}
                sizes={heroImg?.sizes}
                alt=""
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-slow"
              />
            </div>
          )}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {hero.category && (
              <span className="text-accent font-mono text-xs uppercase tracking-widest">{hero.category}</span>
            )}
            <h3 className="font-heading text-3xl md:text-4xl font-bold text-text mt-3 leading-tight underline-hover inline-block">
              {hero.title}
            </h3>
            <p className="mt-4 text-text-muted leading-relaxed">{hero.excerpt}</p>
            <p className="mt-6 text-sm text-text-subtle">
              <time dateTime={hero.date}>{new Date(hero.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
              {hero.author && <> · {hero.author}</>}
              {hero.readMinutes && <> · {hero.readMinutes} min read</>}
            </p>
          </div>
        </div>
      </Link>

      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((p) => {
          // Responsive + modern-format props for the card thumbnail (full-width phone, 1/2 tablet,
          // 1/3 desktop). Additive (falls back to src); no-op for non-CDN URLs.
          const cardImg = p.cover
            ? cdnImageProps(p.cover, '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
            : null;
          return (
          <li key={p.slug}>
            <Link to={`${basePath}/${p.slug}`} className="block group card-tactile overflow-hidden interactive-4 h-full">
              {p.cover && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={cardImg?.src ?? p.cover}
                    srcSet={cardImg?.srcSet}
                    sizes={cardImg?.sizes}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-slow"
                  />
                </div>
              )}
              <div className="p-6">
                {p.category && (
                  <span className="text-accent font-mono text-xs uppercase tracking-widest">{p.category}</span>
                )}
                <h3 className="mt-2 font-heading text-xl font-bold text-text underline-hover inline-block">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-text-muted leading-relaxed line-clamp-3">{p.excerpt}</p>
                <p className="mt-4 text-xs text-text-subtle">
                  <time dateTime={p.date}>{new Date(p.date).toLocaleDateString('en-US')}</time>
                  {p.readMinutes && <> · {p.readMinutes} min</>}
                </p>
              </div>
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

export default BlogList;
