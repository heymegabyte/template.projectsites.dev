import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { applyBrand } from './brand';
import { initCursorRipple } from './lib/cursor';
import { initPerfMonitor } from './lib/perfMonitor';
import { installGlobalImageFailSoft } from './lib/img-failsoft';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

/**
 * Boot the SPA. Deferred behind two animation frames so the static splash hero
 * (index.html `#ps-splash`, styled by inline critical CSS) PAINTS before React's
 * hydration runs. The app bundle is heavy (~6s JS bootup on throttled mobile); if
 * `createRoot().render()` runs immediately after parse it seizes the main thread and
 * the browser never gets a frame to paint the splash first — so FCP/LCP land on the
 * fully-hydrated hero (~3.4s FCP / ~9s LCP) instead of the static splash. Yielding two
 * frames lets the browser paint the splash (~0.7s), then hydration proceeds underneath
 * and `createRoot` clears the splash when the real app is ready.
 */
let booted = false;
function boot(): void {
  if (booted) return;
  booted = true;
  applyBrand();
  initPerfMonitor();
  if (
    typeof window !== 'undefined' &&
    'IntersectionObserver' in window &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.documentElement.classList.add('js-reveal-active');
  }
  initCursorRipple();
  // Fail-soft EVERY broken <img> site-wide (§ C.13) — one capture-phase listener covers
  // the raw content-section images that have no per-element onError, plus any future ones.
  installGlobalImageFailSoft();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

if (typeof requestAnimationFrame === 'function') {
  // Double-rAF: paint the splash on frame N, then hydrate on frame N+1.
  requestAnimationFrame(() => requestAnimationFrame(boot));
  // Safety net — rAF is throttled in background tabs; never strand the splash.
  setTimeout(boot, 1500);
} else {
  boot();
}
