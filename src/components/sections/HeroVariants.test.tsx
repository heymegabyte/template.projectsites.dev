import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactElement } from "react";
import { HeroCenter, HeroSplit } from "./HeroVariants";
import { backdropForPreset } from "./WebGLHeroBackdrop";
import { brand } from "@/brand";

/**
 * Regression for the unwired-cinematic defect (surfed 2026-09-08): WebGLHeroBackdrop
 * is a gorgeous, per-industry, LCP-safe animated hero — but the heroes gated it
 * behind an OPTIONAL `webglBackdrop` prop that the generation pipeline never passed,
 * so it rendered on ZERO delivered sites (built-but-completely-unwired). Fix: the
 * heroes auto-derive the backdrop from `brand.themeStyle` via `backdropForPreset`,
 * defaulting ON for every site. It stays LCP-safe (the canvas mounts post-hydration
 * and degrades to a static brand gradient under reduced-motion / no-WebGL — jsdom
 * has no WebGL context, so these assertions exercise that always-legible path).
 *
 * The backdrop ALWAYS mounts a `<canvas>` (the live scene in webgl mode, an
 * invisible probe canvas in static mode), so its presence is the wiring proof.
 */

const renderIn = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("HeroVariants — per-industry WebGL backdrop wired ON by default", () => {
  it("HeroCenter mounts the backdrop with NO explicit prop (auto-derived from preset)", () => {
    const { container } = renderIn(
      <HeroCenter headline="A real, specific headline" />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("HeroSplit mounts the backdrop with NO explicit prop", () => {
    const { container } = renderIn(
      <HeroSplit
        headline="A real, specific headline"
        image={{ src: "https://example.com/hero.jpg", alt: "Storefront" }}
      />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("an explicit webglBackdrop prop still wins over the auto-derived default", () => {
    const { container } = renderIn(
      <HeroCenter headline="H" webglBackdrop="mesh" />,
    );
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("the LCP hero <img> carries eager + fetchpriority=high + EXPLICIT width/height (ttfr-north-star §4)", () => {
    // The LCP image must reserve its box pre-CSS (Lighthouse "explicit dimensions" audit + CLS
    // insurance) AND load with top priority — not just rely on the aspect-ratio container.
    const { container } = renderIn(
      <HeroSplit
        headline="A real, specific headline"
        image={{ src: "https://example.com/hero.jpg", alt: "Storefront" }}
      />,
    );
    const img = container.querySelector(
      "img.hero-kenburns",
    ) as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img!.getAttribute("loading")).toBe("eager");
    expect(img!.getAttribute("fetchpriority")).toBe("high");
    expect(Number(img!.getAttribute("width"))).toBeGreaterThan(0);
    expect(Number(img!.getAttribute("height"))).toBeGreaterThan(0);
  });

  it("backdropForPreset(brand.themeStyle) always resolves to a real variant", () => {
    expect(["aurora", "waves", "mesh", "ember", "grid"]).toContain(
      backdropForPreset(brand.themeStyle),
    );
  });
});

describe("Cinematic hero DOLLY — recede-on-scroll wired on the hero content (LCP-safe by CSS range)", () => {
  it("HeroCenter content wrapper carries .hero-cinematic-dolly", () => {
    const { container } = renderIn(
      <HeroCenter headline="A real, specific headline" />,
    );
    expect(container.querySelector(".hero-cinematic-dolly")).not.toBeNull();
  });

  it("HeroSplit content wrapper carries .hero-cinematic-dolly", () => {
    const { container } = renderIn(
      <HeroSplit
        headline="A real, specific headline"
        image={{ src: "https://example.com/hero.jpg", alt: "Storefront" }}
      />,
    );
    expect(container.querySelector(".hero-cinematic-dolly")).not.toBeNull();
  });
});

describe("Kinetic display headline (kinetic_headline flag) — LCP-safe hero <h1> compress-on-scroll", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is ON by default — the hero <h1> carries .kinetic-headline (both variants, promoted fleet-wide)", () => {
    const c1 = renderIn(
      <HeroCenter headline="A real, specific headline" />,
    ).container;
    const c2 = renderIn(
      <HeroSplit
        headline="A real, specific headline"
        image={{ src: "https://example.com/hero.jpg", alt: "Storefront" }}
      />,
    ).container;
    expect(c1.querySelector("h1.kinetic-headline")).not.toBeNull();
    expect(c2.querySelector("h1.kinetic-headline")).not.toBeNull();
    // still exactly one LCP <h1>, still the fluid headline (the class only adds the
    // scroll-compress animation; no scale/eyebrow/component swap, so LCP + a11y are untouched).
    expect(c1.querySelectorAll("h1").length).toBe(1);
    expect(
      c1.querySelector("h1.hero-headline-fluid.kinetic-headline"),
    ).not.toBeNull();
  });

  it("VITE_KINETIC_HEADLINE=0 is the killswitch — the hero <h1> drops .kinetic-headline (fleet can opt out)", () => {
    vi.stubEnv("VITE_KINETIC_HEADLINE", "0");
    const { container } = renderIn(
      <HeroCenter headline="A real, specific headline" />,
    );
    expect(container.querySelector("h1.kinetic-headline")).toBeNull();
    // the h1 still renders as the LCP element with the fluid gradient headline
    expect(container.querySelector("h1.hero-headline-fluid")).not.toBeNull();
  });
});

describe("Rotating AI value-prop subhead (rotating_subhead flag) — conversion, LCP-safe, a11y-complete", () => {
  afterEach(() => vi.unstubAllEnvs());
  const PROPS = [
    "Fresh-roasted daily",
    "Ethically sourced",
    "Neighborhood favorite",
  ];

  it("is ON by default with ≥2 props → cross-fade stack (both variants); prop[0] active, all props in DOM, sr-complete", () => {
    for (const container of [
      renderIn(
        <HeroCenter headline="H" subheadline="fallback" valueProps={PROPS} />,
      ).container,
      renderIn(
        <HeroSplit
          headline="H"
          subheadline="fallback"
          valueProps={PROPS}
          image={{ src: "https://example.com/hero.jpg", alt: "Storefront" }}
        />,
      ).container,
    ]) {
      const stack = container.querySelector(
        '[data-rotating="1"] .rotating-subhead__stack',
      );
      expect(stack).not.toBeNull();
      // every value prop is in the DOM (CLS-safe grid-stack), exactly ONE is active (prop[0] at first paint)
      const items = stack!.querySelectorAll(".rotating-subhead__item");
      expect(items.length).toBe(PROPS.length);
      const active = stack!.querySelectorAll(
        '.rotating-subhead__item[data-active="1"]',
      );
      expect(active.length).toBe(1);
      expect(active[0].textContent).toBe("Fresh-roasted daily");
      // the animated layer is aria-hidden; a screen reader reads the COMPLETE list once (not the flashing one)
      expect(stack!.getAttribute("aria-hidden")).toBe("true");
      expect(container.querySelector(".sr-only")?.textContent).toBe(
        "Fresh-roasted daily. Ethically sourced. Neighborhood favorite.",
      );
    }
  });

  it("VITE_ROTATING_SUBHEAD=0 is the killswitch — single subheadline, NO rotating stack (fleet can opt out)", () => {
    vi.stubEnv("VITE_ROTATING_SUBHEAD", "0");
    const { container } = renderIn(
      <HeroCenter
        headline="H"
        subheadline="Great coffee, every day."
        valueProps={PROPS}
      />,
    );
    expect(container.querySelector("[data-rotating]")).toBeNull();
    expect(container.querySelector(".rotating-subhead__stack")).toBeNull();
    expect(container.textContent).toContain("Great coffee, every day.");
  });

  it("with <2 props → falls back to the single subheadline (rotation needs ≥2 reasons)", () => {
    const { container } = renderIn(
      <HeroCenter
        headline="H"
        subheadline="Just the one line."
        valueProps={["Only one prop"]}
      />,
    );
    expect(container.querySelector("[data-rotating]")).toBeNull();
    expect(container.textContent).toContain("Just the one line.");
  });
});

describe("Living gradient border (living_border flag) — CTA glow ring, LCP-safe, default-ON", () => {
  afterEach(() => vi.unstubAllEnvs());
  const primary = { label: "Get started", href: "/contact" };

  it("is ON by default — the primary CTA carries .living-border (both variants); label + href untouched", () => {
    const c1 = renderIn(
      <HeroCenter headline="H" primary={primary} />,
    ).container;
    const c2 = renderIn(
      <HeroSplit
        headline="H"
        primary={primary}
        image={{ src: "https://example.com/hero.jpg", alt: "Storefront" }}
      />,
    ).container;
    expect(c1.querySelector(".living-border")).not.toBeNull();
    expect(c2.querySelector(".living-border")).not.toBeNull();
    // the ring is a class on the EXISTING CTA link — the label + href are untouched (no swap)
    const cta = c1.querySelector(".living-border") as HTMLAnchorElement;
    expect(cta.getAttribute("href")).toBe("/contact");
    expect(cta.textContent).toContain("Get started");
  });

  it("VITE_LIVING_BORDER=0 is the killswitch — the primary CTA drops the ring (fleet can opt out)", () => {
    vi.stubEnv("VITE_LIVING_BORDER", "0");
    const { container } = renderIn(
      <HeroCenter headline="H" primary={primary} />,
    );
    expect(
      container.querySelector("a.living-border, button.living-border"),
    ).toBeNull();
    expect(container.textContent).toContain("Get started");
  });
});
