import { type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { scrubText, hasRealImage } from '@/lib/placeholders';

type Span = 'sm' | 'md' | 'lg' | 'xl';

export interface BentoTile {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  image?: string;
  imageAlt?: string;
  href?: string;
  span?: Span;
  tall?: boolean;
  accent?: boolean;
}

interface Props {
  tiles: BentoTile[];
  className?: string;
  eyebrow?: string;
  headline?: string;
  description?: string;
}

const SPAN_CLASS: Record<Span, string> = {
  sm: 'bento-sm',
  md: 'bento-md',
  lg: 'bento-lg',
  xl: 'bento-xl',
};

/**
 * Track the pointer inside a tile and expose it as `--bento-mx` / `--bento-my`
 * (0–100%). CSS turns that into a soft accent spotlight that follows the cursor
 * — pure decoration, so it's fully gated behind `prefers-reduced-motion` and a
 * fine pointer in `index.css`; touch/keyboard users get the static resting
 * state and lose nothing.
 */
function trackPointer(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--bento-mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--bento-my', `${((e.clientY - r.top) / r.height) * 100}%`);
}

/**
 * Apple-WWDC-style bento grid. 12-col dense pack with subgrid alignment.
 * Per-tile `span` controls width; `tall` doubles the row span.
 * The first tile is treated as the hero cell (auto-promoted to span-lg + tall).
 *
 * Cinematic + interactive layer (every effect gated behind
 * `prefers-reduced-motion: no-preference` via the `.bento-tile*` classes in
 * `index.css`, and neutralised by the global reduced-motion reset — the resting
 * base state is fully visible + legible, so no-JS / reduced-motion never hides a
 * tile): tiles **stagger-reveal** on scroll keyed on the inline `--bento-i`
 * index; each tile **lifts** with an accent ring + soft OKLCH glow and a top
 * **accent hairline** on hover/focus; a **cursor-tracked spotlight**
 * (`--bento-mx/my`) follows the pointer on fine-pointer devices; a diagonal
 * **glass sheen** sweeps across; the icon **springs**; background images do a
 * slow **Ken-Burns** drift + brighten. The promoted hero / accented tile
 * carries a permanent OKLCH accent wash, a fine **grain** texture, and a soft
 * breathing **aura** so the eye lands there first. Titles are fluid (`clamp()`).
 * Colors are theme tokens + `--color-accent` only (validate-site gate).
 */
export function BentoGrid({ tiles, className, eyebrow, headline, description }: Props) {
  const safeEyebrow = scrubText(eyebrow);
  const safeHeadline = scrubText(headline);
  const safeDescription = scrubText(description);
  // Drop tiles whose title is an unresolved token; scrub each surviving tile's
  // text + image so no `{FEATURE_N_TITLE}` / `{FEATURE_N_DESCRIPTION}` renders.
  const safeTiles = tiles
    .map((t) => ({
      ...t,
      title: scrubText(t.title),
      description: scrubText(t.description) || undefined,
      image: hasRealImage(t.image) ? t.image : undefined,
    }))
    .filter((t) => t.title.length > 0);
  if (safeTiles.length === 0) return null;
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      {(safeEyebrow || safeHeadline) && (
        <div className="text-center mb-12 reveal-on-view">
          {safeEyebrow && (
            <span className="text-accent text-sm font-mono tracking-widest uppercase">
              {safeEyebrow}
            </span>
          )}
          {safeHeadline && (
            <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">
              {safeHeadline}
            </h2>
          )}
          {safeDescription && (
            <p className="max-w-2xl mx-auto text-text-muted text-lg">{safeDescription}</p>
          )}
        </div>
      )}

      <div className="bento">
        {safeTiles.map((t, i) => {
          const isHero = i === 0;
          const Comp: 'a' | 'div' = t.href ? 'a' : 'div';
          const span = t.span ?? (isHero ? 'lg' : 'sm');
          const tall = t.tall ?? isHero;
          // Promoted hero cell (or an explicitly-accented tile) carries the
          // permanent OKLCH accent wash + grain + aura; every tile gets the
          // glass-sheen + hover-lift + accent-ring + cursor-spotlight treatment
          // via `.bento-tile`.
          const accent = t.accent || isHero;
          return (
            <Comp
              key={t.id}
              {...(t.href ? { href: t.href } : {})}
              onPointerMove={trackPointer}
              // Per-tile stagger index drives the scroll-reveal offset in CSS.
              style={{ ['--bento-i' as string]: i } as CSSProperties}
              className={cn(
                'group relative isolate overflow-hidden bg-surface border border-border p-6 md:p-8',
                'bento-tile',
                SPAN_CLASS[span],
                tall && 'bento-tall',
                accent && 'bento-tile--accent'
              )}
            >
              {/* Cursor-tracked accent spotlight (fine-pointer + motion-allowed only). */}
              <span aria-hidden="true" className="bento-tile__spot" />
              {/* Soft breathing aura behind the accented/hero cell. */}
              {accent && <span aria-hidden="true" className="bento-tile__aura" />}
              {t.image && (
                <div className="absolute inset-0 -z-10">
                  <img
                    src={t.image}
                    alt={t.imageAlt ?? ''}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="bento-tile__img h-full w-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent" />
                </div>
              )}
              <div className="relative z-[2]">
                {t.icon && (
                  <div className="bento-tile__icon h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 text-accent">
                    {t.icon}
                  </div>
                )}
                <h3 className="bento-tile__title font-bold font-heading text-text mb-2 underline-hover inline-block">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="text-text-muted text-sm md:text-base leading-relaxed">{t.description}</p>
                )}
              </div>
              {t.href && (
                <span
                  aria-hidden="true"
                  className="bento-tile__arrow absolute bottom-6 right-6 z-[2] text-accent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  →
                </span>
              )}
            </Comp>
          );
        })}
      </div>
    </section>
  );
}

export default BentoGrid;
