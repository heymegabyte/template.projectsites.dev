import { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/MagneticButton";
import { cn } from "@/lib/utils";
import { brand } from "@/brand";
import { scrubText, scrubImage } from "@/lib/placeholders";
import { cdnImageProps } from "@/lib/cdn-image";
import {
  WebGLHeroBackdrop,
  backdropForPreset,
  type HeroBackdropVariant,
} from "@/components/sections/WebGLHeroBackdrop";
import { TiltCard } from "@/components/TiltCard";
import { ScrollParallax } from "@/components/ScrollParallax";
import { ScrambleText } from "@/components/ScrambleText";
import { RotatingSubhead } from "@/components/RotatingSubhead";
import {
  kineticHeadlineEnabled,
  livingBorderEnabled,
} from "@/lib/featureFlags";

type Trust = { icon?: "star" | "shield" | "award"; label: string };

/**
 * Scrub trust badges: drop any whose label is an unresolved placeholder so the
 * hero never shows "{TRUST_BADGE_2}" next to real badges.
 */
function scrubTrust(items?: Trust[]): Trust[] {
  if (!items?.length) return [];
  return items
    .map((t) => ({ ...t, label: scrubText(t.label) }))
    .filter((t) => t.label.length > 0);
}

/** Scrub a `{ label, href }` CTA; returns undefined when the label is a placeholder. */
function scrubCta(cta?: {
  label: string;
  href: string;
}): { label: string; href: string } | undefined {
  if (!cta) return undefined;
  const label = scrubText(cta.label);
  return label ? { label, href: cta.href } : undefined;
}

interface CommonProps {
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  /**
   * The business's top value props (site-gen filled). When the `rotating_subhead` flag is on AND
   * ≥2 are present, the hero subhead cross-fades through them (three reasons to convert, not one).
   * Omitted / <2 / flag-dark → the single `subheadline` renders unchanged. See {@link RotatingSubhead}.
   */
  valueProps?: string[];
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  trustBadges?: Trust[];
  className?: string;
  /**
   * Override the animated WebGL hero backdrop variant ('aurora' wellness/creative ·
   * 'waves' finance/professional · 'mesh' tech/AI). Optional — when OMITTED the hero
   * auto-derives the variant from the site's `brand.themeStyle` via `backdropForPreset`,
   * so every generated site gets a fitting animated hero with no per-build opt-in.
   * Always LCP-safe + reduced-motion/no-WebGL → static brand gradient. See
   * {@link WebGLHeroBackdrop}.
   */
  webglBackdrop?: HeroBackdropVariant;
}

const TRUST_ICONS = { star: Star, shield: Shield, award: Award } as const;

function TrustRow({ items }: { items?: Trust[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-12 flex flex-wrap justify-center gap-3 text-sm">
      {items.map((t, i) => {
        const Icon = TRUST_ICONS[t.icon ?? "star"];
        return (
          <span
            key={i}
            // Cinematic credential pill: a glass surface + hairline border, a staggered
            // entrance keyed on `--trust-i`, and a hover lift with the icon springing —
            // all motion-gated via `.trust-pill` in index.css (the resting state is
            // fully legible for reduced-motion / no-JS). Informational, not a control.
            style={{ ["--trust-i" as string]: i } as CSSProperties}
            className="trust-pill inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3.5 py-1.5 text-text-muted backdrop-blur-sm"
          >
            <Icon
              aria-hidden="true"
              className="trust-pill__icon h-4 w-4 text-accent"
            />
            <span>{t.label}</span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Centered cinematic hero — a single OKLCH radial accent AURA + conic halo bloom
 * directly behind the headline, a fine grain wash, a `clamp()` fluid gradient
 * headline, and a staggered `@starting-style` entrance (eyebrow → headline →
 * subhead → CTAs → trust). CTAs lift + gain an accent glow-ring on hover, and a
 * slim scroll cue breathes at the fold.
 *
 * Distinct from `HeroSplit`: this is a symmetric, centered composition with a
 * single centered bloom (HeroSplit uses a copy-anchored twin aurora + LCP photo).
 * This variant has NO image, so nothing here competes for the LCP element; the
 * aura / halo / grain / grid are all decorative (aria-hidden, pointer-events
 * none) and sit behind the z-10 content. All motion is gated behind
 * `prefers-reduced-motion` — base states stay fully visible + legible.
 */
export function HeroCenter({
  eyebrow,
  headline,
  subheadline,
  valueProps,
  primary,
  secondary,
  trustBadges,
  className,
  webglBackdrop,
}: CommonProps) {
  // The headline is the only <h1> — it must ALWAYS render, so fall back to the
  // real business name when the generation token is unresolved. Everything else
  // scrubs to empty/undefined and is hidden by its own guard.
  const safeHeadline = scrubText(headline, brand.business.name);
  const safeEyebrow = scrubText(eyebrow);
  const safeSubheadline = scrubText(subheadline);
  const safePrimary = scrubCta(primary);
  const safeSecondary = scrubCta(secondary);
  const safeTrust = scrubTrust(trustBadges);
  // Auto-derive the per-industry backdrop from the site personality when no explicit
  // override is passed. The generation pipeline reliably sets `themeStyle`, so every
  // delivered site now gets its fitting animated hero with zero per-build opt-in.
  const resolvedBackdrop = webglBackdrop ?? backdropForPreset(brand.themeStyle);
  return (
    <section
      className={cn(
        "relative min-h-screen flex items-center justify-center overflow-hidden grain",
        className,
      )}
    >
      {/* Per-industry animated WebGL backdrop (deepest layer), auto-derived from the
          site personality. Decorative + LCP-safe: the <h1> below is the LCP element;
          this canvas mounts post-hydration and degrades to a static brand gradient
          under reduced-motion / no-WebGL. */}
      {resolvedBackdrop && <WebGLHeroBackdrop variant={resolvedBackdrop} />}
      {/* Centered accent bloom — a single OKLCH aura + slow conic halo behind the
          headline. Both decorative, always behind the z-10 content, no <img> in
          this variant so neither can become the LCP. */}
      <div
        aria-hidden="true"
        className="hero-center-aura pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="hero-center-halo pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
      />
      {/* CINEMATIC-3D depth parallax — two decorative accent orbs drift at DIFFERENT rates as the
          page scrolls (motion.so-style layered depth). LCP-safe (a blurred bg-color div is never an
          LCP candidate; identity at scroll 0), and static under reduced-motion / Firefox. */}
      <ScrollParallax
        depth={1.6}
        className="absolute -top-28 right-[10%] -z-10 h-64 w-64 rounded-full bg-accent/15 blur-3xl"
      />
      <ScrollParallax
        depth={0.6}
        className="absolute bottom-[8%] left-[8%] -z-10 h-52 w-52 rounded-full bg-primary/12 blur-3xl"
      />
      {/* Fine token-tinted grid — sits on border color so it reads on light + dark. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 75%)",
        }}
      />
      <div className="hero-cinematic-dolly relative z-10 max-w-container-wide mx-auto px-6 text-center pt-32 pb-20">
        {safeEyebrow && (
          <span
            className="hero-enter inline-block text-accent text-xs md:text-sm font-mono tracking-[0.3em] uppercase mb-6 px-4 py-2 rounded-full border border-accent/20 bg-accent/5"
            style={{ ["--enter-i" as string]: 0 }}
          >
            <ScrambleText text={safeEyebrow} />
          </span>
        )}
        <h1
          className={cn(
            "hero-enter hero-headline-fluid gradient-text font-heading font-extrabold mx-auto max-w-5xl",
            kineticHeadlineEnabled() && "kinetic-headline",
          )}
          style={{ ["--enter-i" as string]: 1 }}
        >
          {safeHeadline}
        </h1>
        {safeSubheadline && (
          <RotatingSubhead
            text={safeSubheadline}
            items={valueProps}
            className="hero-enter text-lg md:text-xl text-text-muted max-w-2xl mx-auto mt-8 leading-relaxed"
            style={{ ["--enter-i" as string]: 2 }}
          />
        )}
        {(safePrimary || safeSecondary) && (
          <div
            className="hero-enter hero-center-cta flex flex-col sm:flex-row gap-4 justify-center mt-12"
            style={{ ["--enter-i" as string]: 3 }}
          >
            {safePrimary && (
              <MagneticButton>
                <Button
                  asChild
                  size="xl"
                  className={cn(livingBorderEnabled() && "living-border")}
                >
                  <Link to={safePrimary.href}>
                    {safePrimary.label} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </MagneticButton>
            )}
            {safeSecondary && (
              <Button asChild variant="outline" size="xl">
                <Link to={safeSecondary.href}>{safeSecondary.label}</Link>
              </Button>
            )}
          </div>
        )}
        <div className="hero-enter" style={{ ["--enter-i" as string]: 4 }}>
          <TrustRow items={safeTrust} />
        </div>
        {/* Tasteful scroll cue at the fold — the section is full-height. */}
        <div aria-hidden="true" className="mt-16 hidden md:flex justify-center">
          <span className="scroll-cue relative flex h-9 w-[22px] items-start justify-center rounded-full border border-border pt-2">
            <span className="scroll-cue__dot h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        </div>
      </div>
    </section>
  );
}

interface SplitProps extends CommonProps {
  image: { src: string; alt: string };
}

/** Asymmetric hero: copy left, image right. Good for storefronts + services. */
export function HeroSplit({
  eyebrow,
  headline,
  subheadline,
  valueProps,
  primary,
  secondary,
  image,
  trustBadges,
  className,
  webglBackdrop,
}: SplitProps) {
  const safeHeadline = scrubText(headline, brand.business.name);
  const safeEyebrow = scrubText(eyebrow);
  const safeSubheadline = scrubText(subheadline);
  const safePrimary = scrubCta(primary);
  const safeSecondary = scrubCta(secondary);
  const safeTrust = scrubTrust(trustBadges);
  // Drop a placeholder hero image so `{HERO_IMAGE_URL}` never 404s. When there
  // is no real image the copy column spans full width (still a valid hero).
  const safeImage = scrubImage(image);
  // Responsive + modern-format props for the LCP hero photo: raw Unsplash `fm=jpg` full-width
  // URLs → `auto=format` (AVIF/WebP) + a per-width srcSet, so a phone loads a small image, not a
  // 1000px JPEG. In a 2-col split the image is ~50vw ≥lg, 100vw below. Falls back to src (no-op)
  // for non-CDN URLs. The srcSet is additive — the browser always has `src` to fall back to.
  const heroImg = safeImage
    ? cdnImageProps(safeImage.src, "(max-width: 1024px) 100vw, 50vw")
    : null;
  // Auto-derive the per-industry backdrop from the site personality when no explicit
  // override is passed (see HeroCenter) — LCP-safe: the eager hero <img> stays the LCP.
  const resolvedBackdrop = webglBackdrop ?? backdropForPreset(brand.themeStyle);
  return (
    <section
      className={cn(
        "relative isolate pt-32 pb-16 md:pb-24 max-w-container-wide mx-auto px-6",
        className,
      )}
    >
      {/* Per-industry animated WebGL backdrop (deepest layer, auto-derived via
          backdropForPreset from the site personality). Decorative + LCP-safe: it
          mounts post-hydration behind the z-10 grid, always smaller-impact than the
          eager hero <img> (which stays the LCP), and degrades to a static brand
          gradient under reduced-motion / no-WebGL. */}
      {resolvedBackdrop && <WebGLHeroBackdrop variant={resolvedBackdrop} />}
      {/* Cinematic depth behind the COPY — a drifting OKLCH accent aurora + a
          fine grain layer. Both are decorative (aria-hidden, pointer-events
          none), always smaller and behind the eager hero <img>, so neither can
          become the LCP element. Motion is gated by prefers-reduced-motion. */}
      <div
        aria-hidden="true"
        className="hero-aurora pointer-events-none absolute -top-24 -left-24 -z-10 h-[34rem] w-[34rem] rounded-full blur-3xl opacity-70"
      />
      {/* CINEMATIC-3D depth parallax — layered accent orbs drift at different rates on scroll
          (see the HeroCenter note): decorative, LCP-safe, static under reduced-motion / Firefox. */}
      <ScrollParallax
        depth={1.5}
        className="absolute top-[6%] right-[6%] -z-10 h-60 w-60 rounded-full bg-accent/15 blur-3xl"
      />
      <ScrollParallax
        depth={0.55}
        className="absolute -bottom-20 left-[4%] -z-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0 -z-10"
      />
      <div
        className={cn(
          "grid gap-16 items-center",
          safeImage ? "lg:grid-cols-2" : "max-w-3xl mx-auto text-center",
        )}
      >
        <div className="hero-cinematic-dolly relative z-10">
          {safeEyebrow && (
            <span
              className="hero-enter text-accent text-sm font-mono tracking-widest uppercase"
              style={{ ["--enter-i" as string]: 0 }}
            >
              <ScrambleText text={safeEyebrow} />
            </span>
          )}
          <h1
            className={cn(
              "hero-enter hero-headline-fluid mt-4 font-extrabold font-heading",
              kineticHeadlineEnabled() && "kinetic-headline",
            )}
            style={{ ["--enter-i" as string]: 1 }}
          >
            <span className="gradient-text">{safeHeadline}</span>
          </h1>
          {safeSubheadline && (
            <RotatingSubhead
              text={safeSubheadline}
              items={valueProps}
              className="hero-enter mt-6 text-lg md:text-xl text-text-muted leading-relaxed max-w-xl"
              style={{ ["--enter-i" as string]: 2 }}
            />
          )}
          {(safePrimary || safeSecondary) && (
            <div
              className={cn(
                "hero-enter mt-8 flex flex-col sm:flex-row gap-3",
                !safeImage && "justify-center",
              )}
              style={{ ["--enter-i" as string]: 3 }}
            >
              {safePrimary && (
                <MagneticButton>
                  <Button
                    asChild
                    size="lg"
                    className={cn(livingBorderEnabled() && "living-border")}
                  >
                    <Link to={safePrimary.href}>
                      {safePrimary.label}{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </MagneticButton>
              )}
              {safeSecondary && (
                <Button asChild size="lg" variant="outline">
                  <Link to={safeSecondary.href}>{safeSecondary.label}</Link>
                </Button>
              )}
            </div>
          )}
          <TrustRow items={safeTrust} />
        </div>
        {safeImage && (
          <div className="relative">
            {/* Accent ring + glow framing the LCP photo (decorative, behind it). */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-3 -z-10 rounded-[1.75rem] bg-gradient-to-br from-accent/25 via-primary/10 to-transparent blur-2xl"
            />
            {/* Cinematic pointer 3D-tilt (TiltCard): identity at rest → the eager <img> stays the
                LCP; tilt + glare are fine-pointer + motion-gated (touch/reduced-motion → static). */}
            <TiltCard className="card-tactile relative overflow-hidden rounded-2xl aspect-[5/4] shadow-lg ring-1 ring-border">
              <img
                src={heroImg?.src ?? safeImage.src}
                srcSet={heroImg?.srcSet}
                sizes={heroImg?.sizes}
                alt={safeImage.alt}
                loading="eager"
                fetchPriority="high"
                width={1000}
                height={800}
                data-no-zoom
                className="h-full w-full object-cover hero-kenburns"
              />
              {/* Cinematic vignette + top sheen — pure overlay, never the LCP. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-accent/10"
              />
            </TiltCard>
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-20 blur-3xl bg-accent/10 rounded-full"
            />
          </div>
        )}
      </div>
      {/* Tasteful scroll cue — only when there's a full split (photo present). */}
      {safeImage && (
        <div aria-hidden="true" className="mt-16 hidden md:flex justify-center">
          <span className="scroll-cue relative flex h-9 w-[22px] items-start justify-center rounded-full border border-border pt-2">
            <span className="scroll-cue__dot h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
        </div>
      )}
    </section>
  );
}
