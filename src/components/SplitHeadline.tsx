import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { wordRevealEnabled } from '@/lib/featureFlags';

interface Props {
  /** The (already-scrubbed) headline text. */
  text: string;
  /** Heading tag — defaults to `h2` (a section headline). NEVER pass a hero LCP `h1`. */
  as?: 'h2' | 'h3';
  className?: string;
}

/**
 * Kinetic split-text headline (`word_reveal` / VITE_WORD_REVEAL) — the Awwwards-2026 kinetic-
 * typography signature: a below-fold section headline rises + un-blurs one WORD at a time as it
 * scrolls into view. The all-in-one AI builders (Framer / Lovable / v0 / Webflow) don't auto-ship
 * this; we do it embarrassingly-easily — the AI-written headline is split into per-word spans
 * automatically, the owner configures nothing.
 *
 * Flag-OFF (default) → renders the plain heading, byte-identical to before. Flag-ON → per-word spans
 * carrying `--wr-i` (index) so `index.css .word-reveal` can stagger each word via native
 * `animation-timeline: view()` (zero JS, compositor-driven). Use ONLY on below-fold section headings
 * — never the hero LCP `<h1>` (an entrance reveal starts words hidden and would delay LCP).
 *
 * A11y: the container carries `aria-label={text}` (the intact accessible name) and every visual word
 * span is `aria-hidden` — so a screen reader reads the full headline once, never the fragmented
 * pieces. Safe-by-construction: flag-off OR an unsupported / reduced-motion engine shows every word
 * fully visible (see the `.word-reveal` base state), never a stranded `opacity:0` word.
 */
export function SplitHeadline({ text, as = 'h2', className }: Props) {
  const Tag = as;
  if (!wordRevealEnabled()) {
    return <Tag className={className}>{text}</Tag>;
  }
  const words = text.split(/\s+/).filter(Boolean);
  // Degenerate input (empty / single-token) → nothing to stagger; render plain.
  if (words.length < 2) {
    return <Tag className={className}>{text}</Tag>;
  }
  return (
    <Tag className={cn(className, 'word-reveal')} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="wr-word" style={{ '--wr-i': i } as CSSProperties} aria-hidden="true">
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
