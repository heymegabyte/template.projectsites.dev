import { describe, it, expect } from 'vitest';
import { posts } from './content';

/**
 * Blog-default on-brand guard (AL-740 lock · generated-site quality § C.7). The template's default
 * blog posts must read like ANY local business's OWN blog (craft / people / community / welcome),
 * NEVER the platform's web-marketing content — a restaurant blogging about "Core Web Vitals", "the
 * local SEO checklist" or "Google AI Overviews" is off-brand filler that fails the beat-the-source
 * bar (caught live on franklin-barbecue + pizzeria-bianco). AL-740 replaced the web-dev/SEO defaults
 * with warm, universal topics; this locks `content.ts` against a regression to that class.
 *
 * The prod probe `e2e/site-quality/verify-blog-relevance.mjs` now FAIL-OPENS on stale pre-AL-740
 * DEPLOYED sites (a rebuild clears them — no fresh build can produce that blog), so THIS source-level
 * guard is the durable regression catch: a fresh build can only ship web-dev/SEO blog if content.ts
 * regresses, and that fails HERE at template-build time, not silently on prod.
 */
const WEBDEV_SEO_JARGON =
  /core web vitals|core-web-vitals|\bseo\b|local-seo|search engine optimi|google business profile|ai overview|answer engine|generative engine|largest contentful paint|\bLCP\b|\bINP\b|\bCLS\b|schema markup|backlink|\bserp\b|keyword ranking|page ?speed/i;

describe('blog defaults are on-brand — no web-dev/SEO agency filler (AL-740 lock)', () => {
  it('no default post slug/title/category/excerpt reads like a web agency', () => {
    const offenders: string[] = [];
    for (const p of posts) {
      const fields: Record<string, unknown> = {
        slug: p.slug,
        title: p.title,
        category: p.category,
        excerpt: p.excerpt,
      };
      for (const [field, value] of Object.entries(fields)) {
        if (typeof value === 'string' && WEBDEV_SEO_JARGON.test(value)) {
          offenders.push(`${p.slug}.${field}: "${value.slice(0, 60)}"`);
        }
      }
    }
    expect(offenders, `web-dev/SEO jargon in default blog posts:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('ships a non-trivial set of default posts so the blog never renders empty', () => {
    expect(posts.length).toBeGreaterThanOrEqual(2);
    for (const p of posts) {
      expect(p.slug, 'every default post needs a slug').toBeTruthy();
      expect(p.title, 'every default post needs a title').toBeTruthy();
    }
  });
});
