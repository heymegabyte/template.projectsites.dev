import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import SkipLink from "./SkipLink";

/**
 * WCAG 2.4.1 Bypass Blocks (Level A): every generated page ships a skip-to-content link so a
 * keyboard / screen-reader visitor jumps past the whole nav instead of tabbing through it on
 * every page. Two layers guard it — this build-time contract (fast feedback) + the deployed
 * probe e2e/site-quality/verify-skip-link.mjs (fleet-wide, post-hydration). Regression here =
 * a keyboard user re-tabs the nav on every page, a defect axe under-detects (best-practice rule).
 */

describe("SkipLink — WCAG 2.4.1 bypass contract", () => {
  it("is an <a> that targets the #main landmark with clear text", () => {
    const { container } = render(<SkipLink />);
    const a = container.querySelector("a") as HTMLAnchorElement;
    expect(a).not.toBeNull();
    expect(a.getAttribute("href")).toBe("#main");
    expect(a.textContent?.trim()).toMatch(/skip to (the )?main content/i);
  });

  it("is sr-only until focused, then reveals a real on-screen box", () => {
    const { container } = render(<SkipLink />);
    const cls = (container.querySelector("a") as HTMLAnchorElement).className;
    // hidden for sighted users until keyboard focus...
    expect(cls).toContain("sr-only");
    // ...then focus:not-sr-only + a visible fixed box (so a keyboard user SEES where they landed).
    expect(cls).toContain("focus:not-sr-only");
    expect(cls).toMatch(/focus:(fixed|absolute)/);
  });
});

describe("Layout — the skip link is wired FIRST and the <main> target is focusable", () => {
  // cwd is the package root under `vitest run`; import.meta.url is not file:// under Vite's
  // transform (a `new URL(..., import.meta.url)` read throws at COLLECT → 0 tests, a silently
  // disabled gate). Read via the cwd-relative path, like themePresets/design-tokens tests.
  const layout = readFileSync("src/components/Layout.tsx", "utf8");

  it('renders <SkipLink /> and a single focusable <main id="main">', () => {
    expect(layout).toMatch(/import\s+SkipLink\s+from\s+["']\.\/SkipLink["']/);
    expect(layout).toContain("<SkipLink />");
    // the skip TARGET: exactly this focusable landmark (tabindex=-1 lets the skip move focus into it)
    expect(layout).toMatch(/<main\s+id="main"\s+tabIndex=\{-1\}>/);
  });

  it("places <SkipLink /> before <main> so it is the FIRST focusable element (reachable on the first Tab)", () => {
    const skipAt = layout.indexOf("<SkipLink />");
    const mainAt = layout.indexOf('<main id="main"');
    expect(skipAt).toBeGreaterThan(-1);
    expect(mainAt).toBeGreaterThan(-1);
    expect(skipAt).toBeLessThan(mainAt);
  });
});
