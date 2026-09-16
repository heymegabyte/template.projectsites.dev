import { useEffect, useRef, useState } from 'react';
import { textScrambleEnabled } from '@/lib/featureFlags';

/**
 * Kinetic text-scramble — a label "decodes" left-to-right (cycling glyphs → the real text) on first
 * view AND on hover. The Awwwards SOTD tier-1 micro-interaction: a live label that reacts to
 * attention reads as premium in a way flat text never does. Flag-gated (VITE_TEXT_SCRAMBLE, dark by
 * default) — see `@/lib/featureFlags`.
 *
 * Hard-gate safe BY CONSTRUCTION:
 *  - a11y: the REAL text is an always-present `.sr-only` node (the accessible name for screen
 *    readers + the SEO text); the animated glyphs are a SEPARATE `aria-hidden` visual layer.
 *    Flag-off / no-JS / SSR render the plain real text.
 *  - CLS: the scramble preserves the EXACT character count and is intended for MONO type (the hero
 *    eyebrow), where every glyph is fixed-width → zero width jitter → zero layout shift.
 *  - INP: a single ~620ms `requestAnimationFrame` loop that self-cancels on completion + unmount.
 *  - reduced-motion: `prefers-reduced-motion: reduce` → the real text renders immediately, no scramble.
 *
 * Deterministic glyph pick (no Math.random) keeps it test-stable; the visible churn comes from the
 * per-frame timestamp, not RNG.
 */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';
const DURATION_MS = 620;

const prefersReducedMotion = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  /** The real, final text — always in the accessible tree + shown at rest. */
  text: string;
  className?: string;
}

export function ScrambleText({ text, className }: Props) {
  const enabled = textScrambleEnabled();
  const ref = useRef<HTMLSpanElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [display, setDisplay] = useState(text);

  const run = () => {
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    const chars = [...text];
    const start = typeof performance !== 'undefined' ? performance.now() : 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION_MS);
      const revealed = Math.floor(p * chars.length);
      setDisplay(
        chars
          .map((c, i) =>
            c === ' ' || i < revealed ? c : GLYPHS[Math.floor(now / 40 + i * 7) % GLYPHS.length],
          )
          .join(''),
      );
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setDisplay(text); // always settle on the real text
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Decode once when it first scrolls into view.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, text]);

  // Flag-off / SSR: the plain, real, static text (no wrappers, no JS).
  if (!enabled) return <span className={className}>{text}</span>;

  return (
    <span ref={ref} className={className} onPointerEnter={run}>
      {/* Real text for screen readers + crawlers — always present, never scrambled. */}
      <span className="sr-only">{text}</span>
      {/* Visual scramble layer — decorative, hidden from assistive tech. */}
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

export default ScrambleText;
