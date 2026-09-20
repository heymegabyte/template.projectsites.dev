import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { scrubText } from '@/lib/placeholders';

export interface CinematicProcessStep {
  title: string;
  description: string;
  icon?: ReactNode;
}

interface Props {
  steps: CinematicProcessStep[];
  eyebrow?: string;
  headline?: string;
  description?: string;
  className?: string;
}

/**
 * Cinematic process reel (`cinematic_process` / `VITE_CINEMATIC_PROCESS`) — the pinned,
 * scroll-scrubbed "chapters" scrollytelling of the Apple / Awwwards / motion.so tier: a tall
 * wrapper establishes a native CSS **`view-timeline`**, a sticky stage PINS to the viewport, and
 * each process step "act" cross-dissolves + rises into focus one at a time as the visitor scrolls
 * — a progress rail draws through the whole reel. Same content as {@link ProcessSteps} (a step
 * sequence IS the natural scrollytelling), so it auto-populates from the existing PROCESS_* tokens
 * with zero new config (embarrassingly-easy).
 *
 * The pin + scrub is a PURE progressive enhancement layered on the readable base:
 * - **LCP-safe** — below the fold; transform/opacity only; no media that decodes late.
 * - **INP-safe** — driven entirely by the compositor via `animation-timeline: view()`; ZERO
 *   main-thread JS on scroll (the component renders static markup — no effects, no listeners).
 * - **CLS-safe** — the sticky stage reserves `100svh`; acts are absolutely positioned within it.
 * - **Fallback = the content** — the BASE CSS state (no `view-timeline` support / Firefox /
 *   `prefers-reduced-motion: reduce` / < md / no-JS) is a fully-visible, legible vertical stack of
 *   every step. The reel only engages inside `@supports (animation-timeline: view())` +
 *   `@media (min-width:768px) and (prefers-reduced-motion:no-preference)`.
 *
 * DARK by default — `Home` renders the static {@link ProcessSteps} unless `cinematicProcessEnabled()`
 * (`VITE_CINEMATIC_PROCESS=1`) flips it on, so a shipped site is byte-for-byte unchanged until the
 * flag is promoted for the fleet.
 */
export function CinematicProcess({
  steps,
  eyebrow = 'How it works',
  headline,
  description,
  className,
}: Props) {
  const safeEyebrow = scrubText(eyebrow, 'How it works');
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  // Drop steps whose title is an unresolved token; scrub each description (mirrors ProcessSteps).
  const safeSteps = steps
    .map((s) => ({ ...s, title: scrubText(s.title), description: scrubText(s.description) }))
    .filter((s) => s.title.length > 0);
  if (safeSteps.length === 0) return null;
  const n = safeSteps.length;
  // Compute each act's scroll-scrub window as CONCRETE percentages of the `cover` timeline (done
  // in JS, not CSS calc(), which proved unreliable inside `animation-range`). A wrapper of height
  // N×100svh pins its sticky stage across the MIDDLE band of `cover` — from 100/(N+1)% to
  // 100·N/(N+1)% — so subdivide THAT band into N equal act slices.
  const pinStart = 100 / (n + 1);
  const pinWidth = (100 * (n - 1)) / (n + 1);
  const pct = (v: number) => `${v.toFixed(3)}%`;

  return (
    <section
      data-testid="cinematic-process"
      className={cn('cine-section relative max-w-container-wide mx-auto px-6', className)}
      aria-label={safeHeadline || safeEyebrow}
    >
      {/* Intro block reads normally above the pinned stage. */}
      <div className="cine-intro text-center pt-24 md:pt-32 reveal-on-view">
        <span className="text-accent text-sm font-mono tracking-widest uppercase">{safeEyebrow}</span>
        {safeHeadline && (
          <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 text-text">{safeHeadline}</h2>
        )}
        {safeDescription && (
          <p className="text-text-muted max-w-2xl mx-auto text-lg mt-4">{safeDescription}</p>
        )}
      </div>

      {/* Tall wrapper drives the view-timeline; the sticky stage pins while each act scrubs. The
          inline `--cine-acts` count lets the CSS size the scroll travel + slice each act's range. */}
      <div
        className="cine-process"
        style={
          {
            '--cine-acts': n,
            '--cine-rail-from': pct(pinStart),
            '--cine-rail-to': pct(pinStart + pinWidth),
          } as CSSProperties
        }
        data-cine-acts={n}
      >
        <div className="cine-stage">
          <ol className="cine-acts">
            {safeSteps.map((step, i) => (
              <li
                key={step.title}
                className="cine-act"
                data-num={String(i + 1).padStart(2, '0')}
                style={
                  {
                    '--step-i': i,
                    '--cine-from': pct(pinStart + (pinWidth * i) / n),
                    '--cine-to': pct(pinStart + (pinWidth * (i + 1)) / n),
                  } as CSSProperties
                }
              >
                {/* The giant ghost number is a decorative ::before (content: attr(data-num)) — never
                    a text node, so it carries no color-contrast obligation + no AT noise. */}
                <div className="cine-act-body">
                  {step.icon && (
                    <div className="cine-icon h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-5">
                      {step.icon}
                    </div>
                  )}
                  <h3 className="cine-title font-heading font-bold text-text">{step.title}</h3>
                  {step.description && <p className="cine-desc text-text-muted leading-relaxed">{step.description}</p>}
                </div>
              </li>
            ))}
          </ol>
          {/* Progress rail — draws across the whole reel as the timeline advances (decorative). */}
          <div className="cine-hud" aria-hidden="true">
            <span className="cine-rail">
              <span className="cine-rail-fill" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CinematicProcess;
