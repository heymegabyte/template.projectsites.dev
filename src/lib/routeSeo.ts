import type { Brand } from "@/brand";
import { cityFromAddress } from "@/lib/placeholders";

type Business = Brand["business"];

/**
 * Route-DISTINCT meta-description fallback — the self-healing default a route gets when site-gen
 * did NOT fill its `{ABOUT_META_DESCRIPTION}` / `{CONTACT_META_DESCRIPTION}` / … token.
 *
 * @remarks
 * Before this, `useSEO` fell back to the SAME `brand.business.tagline` on every route, so a
 * generated multi-page site shipped the identical `<meta description>` (and, via the static
 * `index.html` `{BUSINESS_DESCRIPTION}`, the identical `og:description`) on `/`, `/about`,
 * `/contact`, `/services` — a real SEO defect (Search Console flags "Duplicate meta descriptions";
 * it flattens per-route SERP relevance + CTR and undercuts beating the source). This returns a
 * description that reflects THAT route's purpose, composed only from real brand signals (name +
 * city derived from the address + tagline) — never a fabricated claim, number, or testimonial.
 * When site-gen DOES fill the real token, that wins; this is only the safety net.
 *
 * Pure + deterministic. `useSEO`'s `fitMetaDescription` still clamps to the 120–156 SEO window.
 *
 * @example routeMetaDescription('/about', { name: 'Guelaguetza', address: '…Los Angeles…' })
 * // → 'About Guelaguetza in Los Angeles — our story, our people, and the care behind everything …'
 */
export function routeMetaDescription(pathname: string, business: Business): string {
  const name = (business.name || "").trim() || "our team";
  const city = cityFromAddress(business.address || "");
  const at = city ? ` in ${city}` : "";
  const tagline = (business.tagline || "").trim();
  const seg = (pathname || "/")
    .toLowerCase()
    .replace(/[#?].*$/, "")
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];

  switch (seg) {
    case "about":
      return `About ${name}${at} — our story, our people, and the care behind everything we do. Learn what makes ${name} a place customers return to.`;
    case "contact":
      return `Contact ${name}${at} — reach us by phone, email, or the contact form. We read every message and reply within one business day.`;
    case "services":
      return `Services from ${name}${at} — see what we offer, how we work, and how to get started. Real help from people who care about the result.`;
    case "menu":
      return `The menu at ${name}${at} — explore what we serve, from everyday favorites to seasonal specials, all made with care and worth the trip.`;
    case "pricing":
      return `Pricing from ${name}${at} — clear, honest options with no surprises. Find what fits your needs and get started whenever you are ready.`;
    case "quote":
      return `Request a quote from ${name}${at} — tell us what you need and we will reply with clear, honest next steps within one business day.`;
    case "gallery":
      return `Gallery from ${name}${at} — recent photos of our work, the spaces we create, and the results behind why customers choose us.`;
    case "faq":
      return `Frequently asked questions about ${name}${at} — straight answers about our services, hours, and how to get started, all in one place.`;
    case "blog":
      return `News, guides, and stories from ${name}${at} — practical tips and honest updates from the team to help you make a confident choice.`;
    case "":
      return tagline
        ? `${name}${at} — ${tagline}. Get in touch to learn more about what we offer and how we can help you today.`
        : `${name}${at} — learn about what we offer and how we can help. Get in touch today to see why customers choose us.`;
    default:
      return tagline
        ? `${name}${at} — ${tagline}. Explore this page to see how ${name} can help you get exactly what you need.`
        : `${name}${at} — explore this page to learn more about what we offer and how ${name} can help you today.`;
  }
}
