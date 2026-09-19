import { render, findByTestId as findByTestIdIn } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * Cinematic Section Rail — the derivation logic (page's own sections → nav entries) + the
 * gating contract (dark by default · short pages / mobile → no clutter · a11y nav + real anchors).
 */
const { flag } = vi.hoisted(() => ({ flag: { on: false } }));
vi.mock("@/lib/featureFlags", () => ({
  sectionRailEnabled: () => flag.on,
}));

import { SectionRail, deriveSections } from "./SectionRail";

function buildMain(html: string): HTMLElement {
  const main = document.createElement("main");
  main.id = "main";
  main.innerHTML = html;
  document.body.appendChild(main);
  return main;
}

afterEach(() => {
  document.body.innerHTML = "";
  flag.on = false;
});

describe("deriveSections — zero-config nav from the page's own sections", () => {
  it("derives outermost labeled sections; respects existing id; aria-label wins over heading", () => {
    const main = buildMain(`
      <section><h2>Welcome Home</h2></section>
      <section id="about"><h2>About Us</h2></section>
      <section aria-label="Our Menu"><h2>Different Heading</h2></section>
      <section></section>
    `);
    const items = deriveSections(main);
    expect(items).toHaveLength(3); // the unlabeled <section> is skipped
    expect(items[0].label).toBe("Welcome Home");
    expect(items[0].id).toMatch(/^ps-rail-welcome-home/);
    expect(items[1].id).toBe("about"); // existing id is respected
    expect(items[2].label).toBe("Our Menu"); // aria-label beats the heading text
  });

  it("skips a section whose heading is still an unfilled {TOKEN} (render-honesty)", () => {
    const main = buildMain(`
      <section><h2>Real Heading</h2></section>
      <section><h2>{ABOUT_HEADLINE}</h2></section>
    `);
    const items = deriveSections(main);
    expect(items.map((i) => i.label)).toEqual(["Real Heading"]);
  });

  it("keeps only OUTERMOST sections (drops nested)", () => {
    const main = buildMain(
      `<section><h2>Outer</h2><section><h2>Inner</h2></section></section>`,
    );
    expect(deriveSections(main).map((i) => i.label)).toEqual(["Outer"]);
  });

  it("truncates a long label to ≤24 chars with an ellipsis", () => {
    const main = buildMain(
      `<section><h2>This heading is definitely much longer than allowed</h2></section>`,
    );
    const [item] = deriveSections(main);
    expect(item.label.length).toBeLessThanOrEqual(24);
    expect(item.label.endsWith("…")).toBe(true);
  });
});

describe("SectionRail — gating + a11y", () => {
  const FOUR = `
    <section><h2>Home</h2></section>
    <section><h2>About</h2></section>
    <section><h2>Services</h2></section>
    <section id="contact"><h2>Contact</h2></section>
  `;
  const renderRail = () =>
    render(
      <MemoryRouter>
        <SectionRail />
      </MemoryRouter>,
    );
  const settle = () => new Promise((r) => setTimeout(r, 80)); // past the double-rAF derive

  it("flag OFF → renders null even with ≥4 sections", async () => {
    buildMain(FOUR);
    flag.on = false;
    const { container } = renderRail();
    await settle();
    expect(container.querySelector('[data-testid="section-rail"]')).toBeNull();
  });

  it("flag ON + <4 sections → null (short pages stay uncluttered)", async () => {
    buildMain(
      `<section><h2>A</h2></section><section><h2>B</h2></section><section><h2>C</h2></section>`,
    );
    flag.on = true;
    const { queryByTestId } = renderRail();
    await settle();
    expect(queryByTestId("section-rail")).toBeNull();
  });

  it("flag ON + ≥4 sections → nav with a real #anchor dot per section, first active", async () => {
    buildMain(FOUR);
    flag.on = true;
    const { container } = renderRail();
    const nav = await findByTestIdIn(container, "section-rail");
    expect(nav.getAttribute("aria-label")).toBe("Page sections");
    const items = Array.from(
      nav.querySelectorAll('[data-testid="section-rail-item"]'),
    );
    expect(items).toHaveLength(4);
    // every dot is a real in-page anchor (keyboard + no-JS friendly)
    expect(items.every((a) => a.getAttribute("href")?.startsWith("#"))).toBe(true);
    // the convert section keeps its own id → jump-to-convert anchor
    expect(items.some((a) => a.getAttribute("href") === "#contact")).toBe(true);
    // first section is active on mount (IntersectionObserver refines it in a real browser)
    expect(items[0].getAttribute("aria-current")).toBe("true");
  });
});
