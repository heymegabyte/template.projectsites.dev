import { cdnImageProps } from '@/lib/cdn-image';
import { focusPullEnabled } from '@/lib/featureFlags';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  heading?: string;
  /** Stable id so the global PhotoSwipe lightbox groups these tiles as one gallery. */
  galleryId?: string;
}

/**
 * `GalleryGrid` — cinematic masonry image grid. Click any tile to open the
 * site-wide PhotoSwipe lightbox: tiles carry a `data-gallery` id (and each
 * `<img>` a `data-caption`) so the global `<Lightbox />` groups + zooms them —
 * no local modal state, and swipe / pinch / keyboard navigation come for free.
 *
 * Cinematic layer (all motion-gated behind `prefers-reduced-motion`): tiles
 * **scroll-reveal** with a per-tile stagger keyed on the inline `--tile-i`
 * index; the image **zooms** gently on hover/focus behind a glass-rounded frame;
 * an **accent ring + shadow** lifts the tile; a caption bar slides up from the
 * base. Focusable tiles keep a visible focus ring. Theme-token colors keep it
 * legible on both light and dark verticals.
 */
export default function GalleryGrid({
  images,
  heading = 'Gallery',
  galleryId = 'gallery-grid',
}: GalleryGridProps) {
  // AL-853: cinematic rack-focus on scroll-in (blur→sharp), dark behind VITE_FOCUS_PULL.
  // Blur-only (no transform) so it never collides with the tile's hover-zoom transform.
  const focusPull = focusPullEnabled() ? ' ps-focus-pull' : '';
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-text mb-12 text-center text-balance reveal-on-view">
          {heading}
        </h2>

        {/* Masonry grid — the whole grid is one PhotoSwipe gallery scope. */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4" data-gallery={galleryId}>
          {images.map((img, i) => {
            const rimg = img.src
              ? cdnImageProps(img.src, '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
              : null;
            return (
            <figure
              key={img.src}
              style={{ ['--tile-i' as string]: i }}
              className="gallery-tile group relative m-0 mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-surface focus-within:outline-none"
            >
              <img
                src={rimg?.src ?? img.src}
                srcSet={rimg?.srcSet}
                sizes={rimg?.sizes}
                alt={img.alt}
                data-gallery={galleryId}
                data-caption={img.caption ?? img.alt}
                tabIndex={0}
                role="button"
                aria-label={`Open image: ${img.alt}`}
                className={`gallery-tile__img w-full h-auto cursor-zoom-in select-none${focusPull}`}
                loading="lazy"
                decoding="async"
              />
              {img.caption && (
                <figcaption className="gallery-tile__cap pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface/95 via-surface/70 to-transparent px-4 pb-3 pt-8 text-sm font-medium text-text">
                  {img.caption}
                </figcaption>
              )}
              {/* Corner accent glyph that fades in on hover as a zoom affordance. */}
              <span
                aria-hidden="true"
                className="gallery-tile__zoom pointer-events-none absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-surface/80 text-accent opacity-0 backdrop-blur-sm transition-opacity duration-base"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
                </svg>
              </span>
            </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
