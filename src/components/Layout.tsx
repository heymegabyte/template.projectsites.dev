import { lazy, Suspense } from 'react';
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
    </>
  );
}
