import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactElement } from "react";
import { HeroCenter } from "@/components/sections/HeroVariants";
import { brand } from "@/brand";
import type { WebGLHeroConfig } from "@/components/webgl/WebGLHero";

/**
 * Opt-in contract for the industry WebGL hero engine (fire-60):
 *
 *   - `_brand.json` WITHOUT a `webgl` block → `brand.webgl` is undefined → the
 *     heroes render the EXISTING auto themeStyle-derived `WebGLHeroBackdrop`
 *     exactly as before; the industry engine's `[data-testid="webgl-hero-layer"]`
 *     host never reaches the DOM.
 *   - an EXPLICIT `webgl` block (even just `{ variant }`) → the heroes swap to
 *     `WebGLHero`, whose layer div always renders. jsdom has NO WebGL context,
 *     so this also exercises the graceful path: `createWebGLHero` returns
 *     `{ ok: false }` and the themed CSS-gradient fallback (painted on the layer
 *     div itself) is the whole treatment — zero thrown errors either way.
 */

vi.mock("@/brand", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/brand")>();
  // Shallow-copy the REAL resolved brand so tests can toggle `webgl` per case
  // without touching canonical module state; all other exports pass through.
  return { ...mod, brand: { ...mod.brand, webgl: undefined } };
});

// The import above resolves to the mocked module — mutate its `webgl` per case.
const mockedBrand = brand as { webgl?: WebGLHeroConfig };

const renderIn = (ui: ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

afterEach(() => {
  mockedBrand.webgl = undefined;
});

describe("WebGLHero opt-in via _brand.json `webgl` block", () => {
  it("brand.webgl ABSENT → no industry layer; the auto backdrop renders unchanged; nothing throws", () => {
    mockedBrand.webgl = undefined;
    let container!: HTMLElement;
    expect(() => {
      ({ container } = renderIn(
        <HeroCenter headline="A real, specific headline" />,
      ));
    }).not.toThrow();
    // The industry engine's host div must NOT be in the DOM…
    expect(
      container.querySelector('[data-testid="webgl-hero-layer"]'),
    ).toBeNull();
    // …while the pre-existing auto WebGLHeroBackdrop still mounts its canvas
    // (static probe canvas in jsdom) — absence of the block = behavior unchanged.
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("brand.webgl = { variant: 'ember' } → the industry layer IS present (gradient fallback path, no WebGL in jsdom)", () => {
    mockedBrand.webgl = { variant: "ember" };
    let container!: HTMLElement;
    expect(() => {
      ({ container } = renderIn(
        <HeroCenter headline="A real, specific headline" />,
      ));
    }).not.toThrow();
    const layer = container.querySelector('[data-testid="webgl-hero-layer"]');
    expect(layer).not.toBeNull();
    // Decorative layer: hidden from AT, content stacks above it.
    expect(layer!.getAttribute("aria-hidden")).toBe("true");
    // The swap is exclusive — the auto WebGLHeroBackdrop branch (the only other
    // canvas source in this hero) must not render alongside the engine. jsdom
    // has no WebGL, so the engine itself appends no canvas either: the themed
    // CSS gradient on the layer div is the whole (error-free) treatment.
    expect(container.querySelector("canvas")).toBeNull();
  });
});
