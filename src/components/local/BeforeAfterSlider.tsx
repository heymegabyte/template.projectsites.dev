import { useRef, useState, useCallback, useEffect } from 'react';
import { cdnImageProps } from '@/lib/cdn-image';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt: string;
  afterAlt: string;
  label?: string;
}

/**
 * `BeforeAfterSlider` — drag (or arrow-key) the accent handle to wipe between a
 * `before` and `after` image. Perfect for cosmetic/dental whitening + Invisalign
 * progress, HVAC/landscaping installs, and remodels.
 *
 * Cinematic + theme-aware: the divider + handle are `var(--color-accent)` with a
 * soft OKLCH glow, the frame reveals on scroll, the knob springs on hover, and a
 * visible focus ring keeps it keyboard-operable. Colors are theme tokens ONLY
 * (`text-text` / `bg-surface` / `border-border` / accent) so it stays legible on
 * BOTH light and dark verticals — the old hardcoded `text-white`/`bg-black` made
 * the labels + handle invisible on light themes (fixed here).
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt,
  afterAlt,
  label,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      updatePosition(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.gtag?.('event', 'before_after_view', { label });
    window.posthog?.capture('before_after_view', { label });
  }, [label]);

  const accentGlow = 'color-mix(in oklch, var(--color-accent) 55%, transparent)';

  // Full-bleed comparison images → responsive, modern-format srcSet (no-op on local URLs).
  const afterImg = afterSrc ? cdnImageProps(afterSrc, '100vw') : null;
  const beforeImg = beforeSrc ? cdnImageProps(beforeSrc, '100vw') : null;

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-6">
        {label && (
          <h3 className="text-xl font-heading font-bold text-text mb-6 text-center text-balance reveal-on-view">
            {label}
          </h3>
        )}

        <div
          ref={containerRef}
          className="reveal-on-view relative aspect-[16/10] rounded-2xl overflow-hidden border border-border bg-surface select-none touch-none cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="slider"
          aria-label="Before and after comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 2));
            if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 2));
          }}
        >
          {/* After image (full, underneath) */}
          <img
            src={afterImg?.src ?? afterSrc}
            srcSet={afterImg?.srcSet}
            sizes={afterImg?.sizes}
            alt={afterAlt}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />

          {/* Before image (clipped) */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <img
              src={beforeImg?.src ?? beforeSrc}
              srcSet={beforeImg?.srcSet}
              sizes={beforeImg?.sizes}
              alt={beforeAlt}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          </div>

          {/* Accent divider + spring knob (theme-token, OKLCH glow). */}
          <div
            className="group absolute top-0 bottom-0 w-0.5 bg-accent motion-safe:transition-[left] motion-safe:duration-75"
            style={{ left: `${position}%`, boxShadow: `0 0 10px ${accentGlow}` }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-surface/85 backdrop-blur-md border border-accent/50 text-accent transition-transform duration-200 group-hover:scale-110 group-active:scale-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              style={{ boxShadow: `0 0 16px -2px ${accentGlow}` }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 4L3 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 4L17 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Labels — glass chips on theme surface. */}
          <span className="absolute top-3 left-3 bg-surface/80 backdrop-blur-sm text-text text-xs font-semibold px-2.5 py-1 rounded-md border border-border pointer-events-none">
            Before
          </span>
          <span className="absolute top-3 right-3 bg-surface/80 backdrop-blur-sm text-text text-xs font-semibold px-2.5 py-1 rounded-md border border-border pointer-events-none">
            After
          </span>
        </div>
      </div>
    </div>
  );
}
