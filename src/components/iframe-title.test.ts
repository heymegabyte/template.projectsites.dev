import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * WCAG 4.1.2 (Name, Role, Value) — EVERY `<iframe>` the template renders must carry a `title`
 * attribute. A title-less iframe is an axe `frame-title` violation on every generated site that
 * renders it (maps, video, booking, demo embeds). This is the AUTHORING guard (static): it fails
 * the build the moment a new/edited iframe drops its `title=`. The runtime non-empty guarantee
 * (a `title={var}` that resolves to "") is covered by the prod probe
 * `e2e/site-quality/verify-iframe-a11y.mjs`.
 *
 * cwd-relative readFileSync (NOT `new URL(import.meta.url)`) so it can never throw at collect and
 * silently disable itself (the collect-time-throw = 0-tests = gate-off trap).
 */

/** Recursively collect every .tsx file under src/ (excluding tests + stories). */
function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) tsxFiles(p, acc);
    else if (
      entry.name.endsWith(".tsx") &&
      !/\.(test|stories)\.tsx$/.test(entry.name)
    )
      acc.push(p);
  }
  return acc;
}

/** Extract each `<iframe … >` opening tag (from `<iframe` to the first `>` that ends it). */
function iframeOpeningTags(src: string): string[] {
  const tags: string[] = [];
  let i = 0;
  while ((i = src.indexOf("<iframe", i)) !== -1) {
    const end = src.indexOf(">", i);
    tags.push(src.slice(i, end === -1 ? undefined : end + 1));
    i = end === -1 ? i + 7 : end + 1;
  }
  return tags;
}

describe("iframe a11y — every template <iframe> has a title attribute (WCAG 4.1.2)", () => {
  const files = tsxFiles("src");
  const withIframe = files.filter((f) =>
    readFileSync(f, "utf8").includes("<iframe"),
  );

  it("at least one template component renders an iframe (guard is exercising real code)", () => {
    expect(withIframe.length).toBeGreaterThan(0);
  });

  it.each(withIframe)("%s: every <iframe> carries a title=", (file) => {
    const src = readFileSync(file, "utf8");
    for (const tag of iframeOpeningTags(src)) {
      expect(tag, `${file} has an <iframe> with no title= attribute`).toMatch(
        /\btitle=/,
      );
    }
  });
});
