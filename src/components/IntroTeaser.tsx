import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * IntroTeaser — a skippable ~1.8s cinematic brand "curtain" on the FIRST homepage visit per
 * session (the motion.so / Awwwards signature opening). A full-bleed brand-gradient wash with the
 * business wordmark + a sweeping accent line, then it lifts to reveal the site.
 *
 * EMBARRASSINGLY-EASY + accessible: session-once (never on a repeat visit or a sub-page nav),
 * `prefers-reduced-motion` → never shows at all, a prominent always-visible **Skip** button + Esc
 * + click-anywhere dismiss instantly, and it auto-dismisses in 1.8s. A busy visitor is never held.
 *
 * LCP-SAFE BY CONSTRUCTION (never regresses the hero LCP):
 *   - The hero (H1 / img) renders in `<main>` UNDERNEATH from t=0 — it is NOT gated behind this
 *     overlay — so its paint is recorded as the LCP at its natural time regardless of the curtain.
 *   - The overlay's only CONTENTFUL element is the modest wordmark (`clamp(…,2rem)`, smaller than
 *     the hero's display H1) and a CSS gradient bg (gradients are NOT LCP candidates), so the hero
 *     stays the largest contentful paint. Exit is transform/opacity only → zero CLS. No lazy libs.
 *
 * Homepage-only via `useLocation` (a deep-link to /contact never waits). CSS lives in the linked
 * `index.css` (`.ps-intro*`) — React 19 drops a component's inline `<style>{string}` on the client.
 */
const SESSION_KEY = 'ps_intro_seen_v1';
const HOLD_MS = 1800;
const EXIT_MS = 650;

export function IntroTeaser() {
  const { pathname } = useLocation();
  const [state, setState] = useState<'init' | 'showing' | 'leaving' | 'done'>('init');
  const skipRef = useRef<HTMLButtonElement>(null);

  // Decide once on arrival: homepage + motion-allowed + not-yet-seen-this-session → show.
  useEffect(() => {
    if (pathname !== '/') {
      setState('done');
      return;
    }
    let reduced = false;
    let seen = false;
    try {
      reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    } catch {
      /* matchMedia unavailable → treat as motion-allowed */
    }
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* storage blocked (private mode) → show once, don't persist */
    }
    if (reduced || seen) {
      setState('done');
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    setState('showing');
  }, [pathname]);

  // Auto-dismiss after the hold; focus the Skip control so Esc/Enter + SR users reach it.
  useEffect(() => {
    if (state !== 'showing') return;
    skipRef.current?.focus();
    const t = setTimeout(() => setState('leaving'), HOLD_MS);
    return () => clearTimeout(t);
  }, [state]);

  // After the exit transition, unmount + hand focus to the main content (never trap).
  useEffect(() => {
    if (state !== 'leaving') return;
    const t = setTimeout(() => {
      setState('done');
      (document.getElementById('main') as HTMLElement | null)?.focus?.();
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [state]);

  // Esc skips immediately.
  useEffect(() => {
    if (state !== 'showing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setState('leaving');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  if (state === 'init' || state === 'done') return null;

  // The business wordmark from the document title's first segment ("Name — tagline"), modest-sized
  // so it never out-ranks the hero H1 for LCP. Fallback keeps it non-empty if the title is bare.
  const business =
    (typeof document !== 'undefined' ? document.title.split(/[—|]/)[0]?.trim() : '') || 'Welcome';

  return (
    <div
      className={`ps-intro${state === 'leaving' ? ' ps-intro--leaving' : ''}`}
      role="dialog"
      aria-label="Site intro"
      onClick={() => setState('leaving')}
      data-testid="intro-teaser"
    >
      <div className="ps-intro__mark" aria-hidden="true">
        {business}
      </div>
      <div className="ps-intro__line" aria-hidden="true" />
      <button
        ref={skipRef}
        type="button"
        className="ps-intro__skip"
        onClick={(e) => {
          e.stopPropagation();
          setState('leaving');
        }}
        data-testid="intro-skip"
      >
        Skip intro
      </button>
    </div>
  );
}
