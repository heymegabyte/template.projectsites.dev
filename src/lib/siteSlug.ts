/**
 * Site-identity derivation — the ONE place that answers "which generated site is this?"
 * from the browser, matching the edge-injected `app.js`'s own logic exactly so every
 * client surface (pageview beacon, newsletter subscribe, contact form) attributes to the
 * same `siteId` the server expects.
 *
 * Extracted from `PageviewBeacon.tsx` when the newsletter signup became the 3rd consumer
 * (per inverted-abstraction-pyramid: write the specific thing twice, then extract). Pure
 * reads of the DOM/location with defensive guards so it is SSR/prerender-safe (returns the
 * fallback when `document`/`location` are absent) and never throws into a caller.
 */

/**
 * Read a config attribute off the injected `app.js` `<script>` tag — the same tag app.js
 * reads its own config from (`data-slug`, `data-api`, …). Returns `fallback` when the tag
 * or attribute is absent (local preview, tests, SSR).
 *
 * @param name - the attribute name, e.g. `'data-slug'`
 * @param fallback - value to return when the attribute is missing
 * @returns the attribute value, or `fallback`
 * @example appJsAttr('data-api', 'https://projectsites.dev') // → the injected API origin, or the default
 */
export function appJsAttr(name: string, fallback: string): string {
  try {
    const tag = document.querySelector('script[src*="/app.js"]');
    const v = tag?.getAttribute(name);
    if (v) return v;
  } catch {
    /* ignore — fall through to the fallback */
  }
  return fallback;
}

/**
 * The site slug the server keys on (`siteId`): the injected app.js `data-slug` when present
 * (so custom-domain sites still attribute correctly), else the hostname's first label
 * (`vitos-salon.projectsites.dev` → `vitos-salon`), else the literal `'site'`. Never throws.
 *
 * @returns the site slug/id for API calls that need `siteId`
 * @example siteSlug() // on vitos-salon.projectsites.dev → 'vitos-salon'
 */
export function siteSlug(): string {
  const bySlug = appJsAttr("data-slug", "");
  if (bySlug) return bySlug;
  try {
    return location.hostname.split(".")[0] || "site";
  } catch {
    return "site";
  }
}
