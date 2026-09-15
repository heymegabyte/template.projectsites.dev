import { Component, lazy, Suspense, type ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import SkipLink from './SkipLink';
import BackToTop from './BackToTop';
import { ScrollProgress } from './ScrollProgress';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { StickyActionBar } from './StickyActionBar';

/*
 * Interaction-triggered chrome — lazy-loaded so their chunks (photoswipe ~60kB behind
 * the Lightbox, plus the Command Palette + dev badge) stay OUT of the initial bundle and
 * the ~6s hydration bootup. They only fire on image-click / Cmd+K, long after first paint,
 * so deferring them cuts bootup cost with no UX loss. PWAInstallPrompt stays eager — it
 * must be listening for `beforeinstallprompt`, which can fire before a lazy chunk mounts.
 */
const Lightbox = lazy(() => import('./Lightbox').then((m) => ({ default: m.Lightbox })));
const CommandPalette = lazy(() =>
  import('./CommandPalette').then((m) => ({ default: m.CommandPalette })),
);
// Gate the lazy DECLARATION on DEV (not just the render): `import.meta.env.DEV` is a static
// `false` in prod, so Vite dead-code-eliminates the `import('./DevA11yBadge')` entirely — no
// chunk emitted, no reference, nothing to 404. (An ungated lazy import fired a 404 + "Failed to
// fetch dynamically imported module" on every delivered site — AL-562.)
const DevA11yBadge = import.meta.env.DEV
  ? lazy(() => import('./DevA11yBadge').then((m) => ({ default: m.DevA11yBadge })))
  : () => null;

/**
 * Swallows a lazy-CHUNK load failure so non-critical interaction chrome (Lightbox,
 * Command Palette, the DEV badge) degrades to "absent" instead of crashing the WHOLE
 * site. A failed dynamic `import()` inside a bare `<Suspense>` propagates up as a render
 * error → the app-level error boundary shows "Something went wrong" and the entire page
 * goes DARK. Reference incident (AL-571): a stale build's `DevA11yBadge-*.js` 404 →
 * `TypeError: Failed to fetch dynamically imported module` → olson-kundig-seattle rendered
 * ONLY the error boundary (0 content). A CDN blip or a stale-deploy chunk-hash mismatch on
 * ANY lazy chunk is the same class. These features are optional; the site is not — render
 * `null` on failure so the eager Header/main/Footer (outside this boundary) always survive.
 */
export class ChunkBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <>
      <SkipLink />
      <ScrollProgress />
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <BackToTop />
      <PWAInstallPrompt />
      <StickyActionBar />
      {/* ChunkBoundary (AL-571): a lazy-chunk load failure here degrades to "feature absent",
          NEVER a whole-site crash. Without it, a failed import() propagates past <Suspense> to
          the app error boundary → "Something went wrong" (olson-kundig-seattle went fully dark
          on a stale DevA11yBadge-*.js 404). */}
      <ChunkBoundary>
        <Suspense fallback={null}>
          <Lightbox />
          <CommandPalette />
          {/* DEV-only: gate the RENDER (not just the component body) so the prod build never
              fires the lazy import — an ungated <DevA11yBadge/> triggered a 404 + "Failed to
              fetch dynamically imported module" on every delivered site (its chunk is dev-only
              + not emitted/served in prod). `import.meta.env.DEV` is statically false in prod,
              so Vite dead-code-eliminates the import entirely. (AL-562) */}
          {import.meta.env.DEV && <DevA11yBadge />}
        </Suspense>
      </ChunkBoundary>
    </>
  );
}
