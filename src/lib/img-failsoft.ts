/**
 * Image fail-soft (§ C.13) — a broken image never paints the browser's broken-image
 * glyph to the visitor. A flaked stock URL, a 200 that isn't a decodable image, a wrong
 * content-type (an HTML error body served as `image/*`), a CORS-tainted decode, or a
 * truncated file all settle as `complete && naturalWidth === 0`; instead of the broken
 * icon we hide the element so the surrounding flex/grid reflows cleanly. Guarded live by
 * `e2e/site-quality/verify-image-render.mjs`.
 *
 * ONE implementation, two entry points:
 *  - `hideBrokenImage(img)` — the core: hide the `<picture>` wrapper if present, else the
 *    `<img>` itself. Used by the universal `<Image>` component's `onError`.
 *  - `installGlobalImageFailSoft(target?)` — a SINGLE document capture-phase `error`
 *    listener that catches EVERY `<img>` load failure site-wide: the raw `<img>` tags in
 *    every content section (HeroVariants, GalleryGrid, FeaturedCollection, Menu, TeamGrid,
 *    …) AND any future ones, with zero per-element wiring. `error` events do NOT bubble,
 *    but the capture phase always runs from `document` down to the target, so one
 *    capture-phase listener observes them all. This is the fleet-wide safety net that
 *    complements `<Image>`'s own composable `onError`.
 */

/** Hide a broken image's `<picture>` wrapper if it has one, else the `<img>` itself. */
export function hideBrokenImage(img: HTMLImageElement): void {
  const picture = img.closest('picture');
  if (picture instanceof HTMLElement) picture.style.display = 'none';
  else img.style.display = 'none';
}

/**
 * Register a single capture-phase `error` listener that fail-softs every broken `<img>`
 * on the page — raw content images that have no per-element `onError`, plus any added
 * later by client navigation. Idempotent to call once at boot.
 *
 * @param target - the event target to bind to (defaults to `document`); accepts any
 *   object exposing `addEventListener`/`removeEventListener` so it's unit-testable.
 * @returns a cleanup function that removes the listener.
 * @remarks Impure — attaches a DOM event listener. Safe to no-op when `target` is absent
 *   (e.g. a non-DOM environment).
 * @example
 * installGlobalImageFailSoft(); // in main.tsx boot() — every broken <img> now hides itself
 */
export function installGlobalImageFailSoft(
  target: Pick<Document, 'addEventListener' | 'removeEventListener'> | undefined =
    typeof document !== 'undefined' ? document : undefined,
): () => void {
  if (!target) return () => {};
  const handler = (event: Event): void => {
    const el = event.target;
    // `error` fires for many resources (scripts, links); only fail-soft <img> elements.
    if (el instanceof HTMLImageElement) hideBrokenImage(el);
  };
  // Capture phase is REQUIRED: <img> error events don't bubble, so a bubble-phase
  // listener on document would never fire.
  target.addEventListener('error', handler, true);
  return () => target.removeEventListener('error', handler, true);
}
