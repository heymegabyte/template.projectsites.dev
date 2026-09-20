import { cn } from '@/lib/utils';
import { lineDrawEnabled } from '@/lib/featureFlags';

interface Props {
  /** Extra classes (e.g. margin) for the inline SVG. */
  className?: string;
}

/**
 * LineAccent (AL-849, `line_draw` dark) — a hand-drawn accent stroke that DRAWS itself in as the
 * section scrolls into view (the Awwwards/Codrops "stroke reveals" signature). A genuinely-new
 * visual class for the template, which had translates/scales/tilts/opacity-reveals but no
 * SVG stroke-draw.
 *
 * Safe by construction:
 * - Decorative only (`aria-hidden`, `focusable=false`) — never in the a11y tree, no layout role.
 * - LCP-safe — a thin (≤8px tall) below-fold SVG, never a Largest-Contentful-Paint candidate; the
 *   draw is driven by the compositor via native `animation-timeline: view()` (zero JS, no lib).
 * - Reduced-motion / no-`@supports` / SSR → the BASE CSS state is fully DRAWN (`stroke-dashoffset:0`,
 *   see `.ps-line-accent` in index.css), so Firefox / reduced-motion / no-JS get the static accent,
 *   never a stranded-invisible line.
 * - Renders `null` when the flag is off (dark by default).
 *
 * @example <LineAccent className="mt-3" />
 */
export function LineAccent({ className }: Props) {
  if (!lineDrawEnabled()) return null;
  return (
    <svg
      className={cn('ps-line-accent block text-accent', className)}
      width="132"
      height="8"
      viewBox="0 0 132 8"
      fill="none"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      {/* A subtly hand-drawn underline: quadratic → smooth-continuation wave, ~132px wide. */}
      <path
        d="M1 5 Q 33 1 66 4 T 131 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default LineAccent;
