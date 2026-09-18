/**
 * @module lib/cdn-image
 * @description Rewrite a remote CDN image URL (Unsplash/Pexels/Pixabay) into RESPONSIVE,
 * MODERN-FORMAT `<img>` props. The generator hands the template raw Unsplash URLs like
 * `…?crop=entropy&fm=jpg&fit=max` — a single full-width JPEG served to EVERY viewport, so a phone
 * downloads a ~1000px JPEG for a 390px slot. Rewriting to `auto=format` (Unsplash serves AVIF/WebP
 * to supporting browsers) + a per-width `srcSet` is the single biggest CWV + bandwidth win and the
 * clearest "beat the source" lever — the original sites almost never ship responsive images.
 *
 * Pure + idempotent: strips any existing `w/h/fm/auto/q/dpr` before re-applying, so double-calling
 * is safe. Non-CDN / local URLs pass through unchanged (those rely on the `<Image>` component's
 * pre-generated `.avif`/`.webp` siblings instead).
 */

/** Hosts whose images we can resize + reformat purely via query params. */
const RESIZABLE_CDN =
  /^https?:\/\/(images\.unsplash\.com|images\.pexels\.com|[a-z0-9.-]*pixabay\.com)\//i;

/** Default responsive width ladder (px). */
export const DEFAULT_WIDTHS = [480, 768, 1024, 1440, 1920] as const;

export interface CdnImageProps {
  /** The `src` to use (a mid-ladder, modern-format URL for CDN images; the original otherwise). */
  src: string;
  /** Responsive `srcSet` (present only for resizable CDN URLs). */
  srcSet?: string;
  /** The `sizes` attribute paired with `srcSet`. */
  sizes?: string;
}

/** True when the URL is a remote CDN image we can resize/reformat via query params. */
export function isResizableCdn(url: string): boolean {
  return typeof url === 'string' && RESIZABLE_CDN.test(url);
}

/** Strip our own resize/format params so re-application is idempotent (keeps crop/cs/fit/ixid). */
function baseCdnUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const p of ['w', 'h', 'fm', 'auto', 'q', 'dpr']) u.searchParams.delete(p);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Rewrite a remote CDN image URL into responsive, modern-format props.
 *
 * @param url    - the source image URL (raw Unsplash/Pexels/Pixabay, possibly `fm=jpg`).
 * @param sizes  - the CSS `sizes` attribute (default full-width `100vw`).
 * @param widths - responsive width descriptors (default {@link DEFAULT_WIDTHS}).
 * @returns `{ src, srcSet, sizes }` for a resizable CDN URL; `{ src: url }` unchanged otherwise.
 * @example
 * cdnImageProps('https://images.unsplash.com/photo-x?crop=entropy&fm=jpg&fit=max');
 * // → { src: 'https://images.unsplash.com/photo-x?crop=entropy&fit=max&auto=format&q=72&w=1024',
 * //     srcSet: '…&w=480 480w, …&w=768 768w, …&w=1024 1024w, …&w=1440 1440w, …&w=1920 1920w',
 * //     sizes: '100vw' }
 */
export function cdnImageProps(
  url: string,
  sizes: string = '100vw',
  widths: readonly number[] = DEFAULT_WIDTHS,
): CdnImageProps {
  if (!isResizableCdn(url)) return { src: url };
  const base = baseCdnUrl(url);
  const sep = base.includes('?') ? '&' : '?';
  const at = (w: number): string => `${base}${sep}auto=format&q=72&w=${w}`;
  const srcSet = widths.map((w) => `${at(w)} ${w}w`).join(', ');
  return { src: at(widths[Math.floor(widths.length / 2)] ?? widths[widths.length - 1]), srcSet, sizes };
}
