import { useEffect, useState } from 'react';
import { resolveWelcomeContext, type WelcomeContext } from '../lib/welcomeContext';
import { personalizedRibbonEnabled } from '../lib/featureFlags';

const VISITED_KEY = 'ps_visited';
const DISMISS_KEY = 'ps_welcome_dismissed';

/**
 * Smart Welcome Ribbon — a zero-config, visitor-adaptive greeting (the 2026 "liquid UI"
 * AI-personalization trend, shipped AUTOMATIC). Reads the referrer + a returning-visitor marker
 * CLIENT-SIDE (no server, no owner config) and shows ONE tailored line for a recognized arrival
 * (returning visitor, or arrival from a social platform); a first-time visitor from search/direct
 * sees nothing (no noise). Beats Framer/Webflow, which need manual UTM pages + routing rules.
 *
 * Performance + a11y by construction:
 *   - `position: fixed` → ZERO CLS (never shifts the hero); renders POST-hydration behind a ~900ms
 *     timer so it's never the LCP element.
 *   - Fade + rise is `motion-safe:` only → `prefers-reduced-motion` gets an instant, static appear.
 *   - `role="status"` + `aria-live="polite"` announce it; dismiss button is keyboard-focusable.
 *   - Dismissible + auto-hides after 9s; a dismiss is remembered (localStorage) so it never nags.
 *   - Dark by default (`personalizedRibbonEnabled()` — experimental flag `personalized_ribbon`).
 */
export function SmartWelcomeRibbon() {
  const [ctx, setCtx] = useState<WelcomeContext | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!personalizedRibbonEnabled() || typeof window === 'undefined') return;
    let isReturning = false;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return; // respect a prior dismiss — never nag
      isReturning = localStorage.getItem(VISITED_KEY) === '1';
      localStorage.setItem(VISITED_KEY, '1'); // mark this visit → the NEXT one reads as "returning"
    } catch {
      /* private mode → treat as a first-time visitor */
    }
    const businessName =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
      document.querySelector('meta[name="application-name"]')?.getAttribute('content') ||
      undefined;
    const resolved = resolveWelcomeContext({
      referrer: document.referrer || '',
      isReturning,
      businessName: businessName ?? undefined,
      selfHost: location.host,
    });
    if (!resolved.show) return;
    // Defer so the greeting never competes with the hero's LCP paint.
    const t = window.setTimeout(() => {
      setCtx(resolved);
      requestAnimationFrame(() => setVisible(true));
    }, 900);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ctx) return;
    const t = window.setTimeout(dismiss, 9000); // auto-hide
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode */
    }
    window.setTimeout(() => setCtx(null), 450);
  }

  if (!ctx) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      data-ps-welcome={ctx.kind}
      className={[
        'fixed left-1/2 top-[76px] z-[90] flex max-w-[92vw] -translate-x-1/2 items-center gap-2',
        'rounded-full border px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md',
        'border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text)]',
        'motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
      ].join(' ')}
    >
      <span className="truncate">{ctx.message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="ml-1 grid h-6 w-6 shrink-0 place-items-center rounded-full text-lg leading-none text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--color-accent)]"
      >
        &times;
      </button>
    </div>
  );
}
