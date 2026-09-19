import { Marquee } from "./Marquee";
import { cn } from "@/lib/utils";
import { scrubText, hasRealImage } from "@/lib/placeholders";

export interface Logo {
  name: string;
  src?: string;
  href?: string;
  /** Falls back to a styled wordmark when `src` is missing. */
}

interface Props {
  logos: Logo[];
  eyebrow?: string;
  headline?: string;
  variant?: "marquee" | "grid";
  className?: string;
}

/**
 * "As seen in" / partner / client logo strip. Two variants:
 * - `marquee` (default): infinite scroll (motion-gated; falls back to a calm
 *   static row when motion is reduced).
 * - `grid`: static responsive grid for static social proof.
 *
 * Cinematic layer (all motion-gated behind `prefers-reduced-motion`): each logo
 * sits desaturated + dimmed and **lifts to full color + full opacity on hover**
 * (`.logo-chip`); grid logos **stagger-reveal** on scroll keyed on the inline
 * `--logo-i` index; a hair-thin **OKLCH accent divider** frames the strip. It
 * stays calm + tasteful — a trust strip, not a hero.
 *
 * Missing logo files render as desaturated brand-name wordmarks so the section
 * never has gaps during development.
 */
export function LogoCloud({
  logos,
  eyebrow,
  headline,
  variant = "marquee",
  className,
}: Props) {
  // Drop logos whose name is an unresolved token (`{LOGO_1_NAME}`); keep only a
  // real `src`. If nothing real remains, hide the whole strip.
  const safeLogos = logos
    .map((l) => ({
      ...l,
      name: scrubText(l.name),
      src: hasRealImage(l.src) ? l.src : undefined,
    }))
    .filter((l) => l.name.length > 0);
  const safeEyebrow = scrubText(eyebrow);
  const safeHeadline = scrubText(headline);
  if (safeLogos.length === 0) return null;

  // A real external link only — a `#` / empty / `{token}` href is a dead control (the old `?? '#'`
  // scrolled to top / no-op'd), so a linkless logo renders as a non-interactive mark instead.
  const isRealHref = (h?: string): h is string =>
    typeof h === "string" && h.startsWith("http");

  const logoInner = (l: (typeof safeLogos)[number]) =>
    hasRealImage(l.src) ? (
      <img
        src={l.src}
        alt={l.name}
        className="h-8 md:h-10 w-auto object-contain"
        loading="lazy"
        decoding="async"
      />
    ) : (
      <span className="font-heading font-bold text-lg md:text-xl tracking-tight text-text">
        {l.name}
      </span>
    );

  const items = safeLogos.map((l) =>
    isRealHref(l.href) ? (
      <a
        key={l.name}
        href={l.href}
        className="logo-chip inline-flex items-center px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        aria-label={l.name}
      >
        {logoInner(l)}
      </a>
    ) : (
      <span key={l.name} className="logo-chip inline-flex items-center px-2">
        {logoInner(l)}
      </span>
    ),
  );

  return (
    <section
      className={cn(
        "py-16 md:py-24 max-w-container-wide mx-auto px-6",
        className,
      )}
    >
      {(safeEyebrow || safeHeadline) && (
        <div className="text-center mb-10 reveal-on-view">
          {safeEyebrow && (
            <span className="text-accent text-xs font-mono tracking-widest uppercase">
              {safeEyebrow}
            </span>
          )}
          {safeHeadline && (
            <h2 className="text-xl md:text-2xl font-medium text-text-muted mt-3">
              {safeHeadline}
            </h2>
          )}
        </div>
      )}

      {/* Hair-thin OKLCH accent divider framing the strip. */}
      <div className="logo-strip relative">
        <span aria-hidden="true" className="logo-rule logo-rule--top" />
        {variant === "marquee" ? (
          <div className="py-6">
            <Marquee items={items} speed="slow" pauseOnHover />
          </div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-8 gap-y-10 items-center justify-items-center py-8">
            {safeLogos.map((l, i) => (
              <li
                key={l.name + i}
                style={{ ["--logo-i" as string]: i }}
                className="logo-chip"
              >
                {isRealHref(l.href) ? (
                  <a
                    href={l.href}
                    className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
                    aria-label={l.name}
                  >
                    {logoInner(l)}
                  </a>
                ) : (
                  <span className="inline-flex items-center">
                    {logoInner(l)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <span aria-hidden="true" className="logo-rule logo-rule--bottom" />
      </div>
    </section>
  );
}

export default LogoCloud;
