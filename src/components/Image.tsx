import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { hideBrokenImage } from '@/lib/img-failsoft';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  /** Required path to a source image. Looks for `.avif` + `.webp` siblings. */
  src: string;
  /** REQUIRED. Empty string allowed only for purely decorative images (paired with aria-hidden). */
  alt: string;
  /** If this image is the LCP of the page, set `priority` so it preloads + sets fetchpriority + eager loading. */
  priority?: boolean;
  /** Aspect ratio hint (e.g. `16 / 9`). Prevents CLS. */
  aspect?: string;
  /** Optional explicit srcset for responsive images. */
  srcSet?: { src: string; width: number }[];
  /** Sizes attribute for srcset. Defaults to `100vw`. */
  sizes?: string;
}

function siblingPath(src: string, ext: string): string | null {
  // Remote CDN URLs (Unsplash/Pexels) already negotiate AVIF/WebP themselves via `auto=format`,
  // and swapping the extension on a query-string URL yields a broken host
  // (`images.unsplash.com/photo-x?…` → `images.unsplash.avif`) that renders a failed <source>
  // for EVERY image. Skip sibling generation for them so the browser loads the real <img src>
  // directly — the CDN serves modern formats on that same URL. Local assets still get siblings.
  if (/^https?:/i.test(src) || src.includes('?')) return null;
  const dot = src.lastIndexOf('.');
  if (dot <= src.lastIndexOf('/')) return null; // dot must be a real filename extension, not a path/host dot
  return src.slice(0, dot) + ext;
}

/**
 * Universal `<Image>` — wraps `<picture>` with AVIF + WebP + original-format
 * fallback. Standard conventions:
 *
 * - `alt` required (TypeScript prevents missing alt at the type level).
 * - `priority` flag sets eager loading + `fetchpriority="high"` on the LCP image.
 * - All other images default to `loading="lazy"` + `decoding="async"`.
 * - `aspect` prop sets `aspect-ratio` to prevent layout shift before load.
 *
 * Filename convention for AVIF / WebP siblings:
 *
 *   hero.jpg              ← provide
 *   hero.webp             ← auto-detected sibling
 *   hero.avif             ← auto-detected sibling
 *
 * If siblings don't exist, the browser falls through to the original.
 */
export const Image = forwardRef<HTMLImageElement, Props>(
  ({ src, alt, priority, aspect, srcSet, sizes = '100vw', className, onError, ...rest }, ref) => {
    const avif = siblingPath(src, '.avif');
    const webp = siblingPath(src, '.webp');

    const responsive = srcSet?.map((s) => `${s.src} ${s.width}w`).join(', ');

    return (
      <picture>
        {(responsive ?? avif) && (
          <source type="image/avif" srcSet={responsive ?? avif!} sizes={sizes} />
        )}
        {(responsive ?? webp) && (
          <source type="image/webp" srcSet={responsive ?? webp!} sizes={sizes} />
        )}
        <img
          ref={ref}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          className={cn(className)}
          style={aspect ? { aspectRatio: aspect, ...rest.style } : rest.style}
          onError={(e) => {
            // Fail-soft: a broken image hides its whole <picture> instead of painting the browser's
            // broken-image glyph — the surrounding flex/grid reflows cleanly (§ C.13). Shares the one
            // implementation with the global capture-phase listener in lib/img-failsoft.ts, then runs
            // the caller's own onError. Guarded by e2e/site-quality/verify-image-render.mjs.
            hideBrokenImage(e.currentTarget);
            onError?.(e);
          }}
          {...rest}
        />
      </picture>
    );
  },
);
Image.displayName = 'Image';

export default Image;
