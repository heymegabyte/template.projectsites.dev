import { useEffect } from 'react';
import { brand } from '@/brand';
import { scrubText, fitMetaDescription, fitMetaTitle } from '@/lib/placeholders';
import { routeMetaDescription } from '@/lib/routeSeo';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
}

export function useSEO({ title, description, canonical }: SEOProps) {
  useEffect(() => {
    // Scrub before writing: an unresolved `{TOKEN}` or leaked generation-plan
    // string (e.g. "…Sections: Hero, About, Services…") must never become the
    // page title or meta description. That same head text is what the edge
    // app-shell reads for its static hero, so a leak here would poison the LCP
    // too. Fall back to real brand copy so the tags are always meaningful.
    // Scrub first, then guarantee the 50–60 SEO length: generation pads the
    // HOMEPAGE title but ships short sub-page ones ("About — {Business}") — pad
    // short ones with real brand copy so `meta.title_length` always passes.
    const safeTitle = fitMetaTitle(scrubText(title, brand.business.name), brand.business);
    // Scrub first, then guarantee the 120–156 SEO length. The fallback is now ROUTE-DISTINCT:
    // when site-gen didn't fill a sub-page's `{*_META_DESCRIPTION}` token, every route used to
    // fall back to the SAME `brand.business.tagline` → identical `<meta description>` on `/`,
    // `/about`, `/contact` (Search Console "Duplicate meta descriptions" — flattens per-route
    // SERP relevance). `routeMetaDescription` composes a description that reflects THIS route
    // (from the real name + city + tagline, never fabricated). Real filled tokens still win.
    const routeFallback = routeMetaDescription(
      typeof window !== 'undefined' ? window.location.pathname : '/',
      brand.business,
    );
    const safeDescription = fitMetaDescription(
      scrubText(description, routeFallback),
      brand.business,
    );

    document.title = safeTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', safeDescription);

    // Mirror the route-distinct title + description into the social cards. `index.html` ships ONE
    // static `og:description` ({BUSINESS_DESCRIPTION}, filled once at build) + og:title, so without
    // this every route shared the homepage's social preview — a duplicate-OG defect the crawler
    // sees. Only UPDATE existing tags (never inject), so this is a no-op when a tag is absent.
    for (const sel of ['meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      document.querySelector(sel)?.setAttribute('content', safeDescription);
    }
    for (const sel of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      document.querySelector(sel)?.setAttribute('content', safeTitle);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }
  }, [title, description, canonical]);
}
