import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { rotatingSubheadEnabled } from '@/lib/featureFlags';

/** Dwell time per value prop before cross-fading to the next (ms). */
const ROTATE_MS = 3800;

interface RotatingSubheadProps {
  /** The single fallback subheadline — rendered verbatim when rotation is off / unavailable. */
  text: string;
  /** The AI value props to rotate through (site-gen filled). Rotation needs ≥2. */
  items?: string[];
  className?: string;
  style?: CSSProperties;
}

/**
 * RotatingSubhead — the AI value-proposition rotator (flag `rotating_subhead` /
 * VITE_ROTATING_SUBHEAD, DARK by default). When site-gen supplies ≥2 `items` (the business's top
 * value props), the hero subhead cross-fades through them so a visitor sees THREE reasons to convert
 * instead of one — the Stripe / Linear rotating-headline pattern, AI-filled + automatic (the owner
 * just confirms). Zero-risk fallback: dark flag, reduced-motion, or < 2 props → the plain `text`
 * subheadline, byte-identical to today.
 *
 * LCP-safe: `items[0]` paints as ordinary text at first render (the subhead sits below the <h1> LCP
 * element). The props render in a CSS grid-STACK (all in one grid cell → the <p> sizes to the tallest
 * prop → zero CLS as they rotate). The cross-fade only starts post-hydration; reduced-motion → no
 * timer, `items[0]` shown static. a11y: the FULL prop list is always in the DOM via a visually-hidden
 * span, so a screen reader reads the complete value once; the animated layer is `aria-hidden`.
 *
 * @param props - {@link RotatingSubheadProps}
 * @returns the hero sub-headline `<p>` — a static line or the rotating value-prop stack.
 * @example
 * <RotatingSubhead text="Great coffee, every day." items={["Fresh-roasted daily","Ethically sourced"]} />
 */
export function RotatingSubhead({ text, items, className, style }: RotatingSubheadProps) {
  const props = (items ?? []).map((s) => s.trim()).filter(Boolean);
  const rotate = rotatingSubheadEnabled() && props.length >= 2;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!rotate) return;
    const reduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // reduced-motion → hold on prop[0], no rotation
    const id = window.setInterval(() => setI((n) => (n + 1) % props.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [rotate, props.length]);

  if (!rotate) {
    return (
      <p className={className} style={style}>
        {text}
      </p>
    );
  }

  return (
    <p className={cn(className, 'rotating-subhead')} style={style} data-rotating="1">
      {/* Animated visible layer — a grid-stack (CLS-safe: the <p> sizes to the tallest prop). Only the
          active prop is opaque; aria-hidden so SR reads the full list below, not the flashing word. */}
      <span aria-hidden="true" className="rotating-subhead__stack">
        {props.map((p, idx) => (
          <span key={idx} className="rotating-subhead__item" data-active={idx === i ? '1' : '0'}>
            {p}
          </span>
        ))}
      </span>
      {/* Complete value list for assistive tech — always in the DOM, never the flashing one only. */}
      <span className="sr-only">{props.join('. ')}.</span>
    </p>
  );
}
