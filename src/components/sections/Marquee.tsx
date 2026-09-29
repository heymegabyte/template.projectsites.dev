import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  items: ReactNode[];
  /**
   * Inert render of the SAME items for the duplicate seam strip. The clone track
   * is `aria-hidden` (its content is a purely visual repeat), so any focusable
   * item inside it must be rendered with `tabIndex={-1}` — pass that variant
   * here. Defaults to `items` (fine when items are non-interactive).
   */
  itemsInert?: ReactNode[];
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  reverse?: boolean;
  pauseOnHover?: boolean;
}

const SPEED: Record<NonNullable<Props['speed']>, string> = {
  slow:   '60s',
  normal: '28s',
  fast:   '14s',
};

/**
 * Infinite-loop marquee with `prefers-reduced-motion` kill-switch.
 * Duplicates the track once so the seam is invisible. Hover-pause optional
 * (also pauses on keyboard focus-within so tabbed-to items stop moving —
 * WCAG 2.2.2).
 *
 * A11y-correct marquee pattern: the FIRST track is the real, exposed content
 * (focusable, perceivable once); only the DUPLICATE track is `aria-hidden` —
 * its descendants inherit the hidden state, and interactive clones must be
 * passed via `itemsInert` with `tabIndex={-1}` so a screen-reader / keyboard
 * user never meets the same item twice (no focusable-inside-aria-hidden
 * violation, no duplicated tab stops).
 */
export function Marquee({ items, itemsInert, className, speed = 'normal', reverse, pauseOnHover }: Props) {
  const dur = SPEED[speed];
  const dir = reverse ? 'reverse' : 'normal';
  return (
    <div
      className={cn(
        'marquee',
        pauseOnHover &&
          'hover:[&_.marquee__track]:[animation-play-state:paused] focus-within:[&_.marquee__track]:[animation-play-state:paused]',
        className,
      )}
    >
      <div className="marquee__track" style={{ animationDuration: dur, animationDirection: dir }}>
        {items.map((it, i) => (
          <div key={`a-${i}`} className="flex items-center justify-center shrink-0">{it}</div>
        ))}
      </div>
      {/* Seam clone — hidden from AT; descendants inherit aria-hidden. */}
      <div
        aria-hidden="true"
        className="marquee__track"
        style={{ animationDuration: dur, animationDirection: dir }}
      >
        {(itemsInert ?? items).map((it, i) => (
          <div key={`b-${i}`} className="flex items-center justify-center shrink-0">{it}</div>
        ))}
      </div>
    </div>
  );
}

export default Marquee;
