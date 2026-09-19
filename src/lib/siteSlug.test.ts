import { describe, it, expect, afterEach } from "vitest";
import { appJsAttr, siteSlug } from "./siteSlug";

/**
 * siteSlug / appJsAttr — the ONE site-identity derivation shared by PageviewBeacon +
 * Newsletter (extracted when the newsletter became the 3rd consumer). Locks the precedence
 * (injected app.js `data-slug` wins over the hostname) and the never-throw fallbacks, so a
 * client API call always sends the same `siteId` the server keys on.
 */

/** Inject a fake app.js <script> tag (what the edge injects into every generated site). */
function injectAppJs(attrs: Record<string, string>): HTMLScriptElement {
  const tag = document.createElement("script");
  tag.src = "https://projectsites.dev/app.js";
  for (const [k, v] of Object.entries(attrs)) tag.setAttribute(k, v);
  document.body.appendChild(tag);
  return tag;
}

afterEach(() => {
  document
    .querySelectorAll('script[src*="/app.js"]')
    .forEach((n) => n.remove());
});

describe("appJsAttr", () => {
  it("returns the fallback when no app.js tag is present", () => {
    expect(appJsAttr("data-api", "https://projectsites.dev")).toBe(
      "https://projectsites.dev",
    );
  });

  it("reads an attribute off the injected app.js tag", () => {
    injectAppJs({ "data-api": "https://custom.example.com" });
    expect(appJsAttr("data-api", "https://projectsites.dev")).toBe(
      "https://custom.example.com",
    );
  });

  it("returns the fallback when the tag exists but the attribute does not", () => {
    injectAppJs({ "data-slug": "x" });
    expect(appJsAttr("data-api", "FB")).toBe("FB");
  });
});

describe("siteSlug", () => {
  it("PREFERS the injected data-slug (custom-domain sites still attribute correctly)", () => {
    injectAppJs({ "data-slug": "vitos-salon" });
    expect(siteSlug()).toBe("vitos-salon");
  });

  it("falls back to the hostname first label when no data-slug is injected", () => {
    // No app.js tag → derives from location.hostname's first label; never empty, never throws.
    const expected = location.hostname.split(".")[0] || "site";
    expect(siteSlug()).toBe(expected);
    expect(siteSlug().length).toBeGreaterThan(0);
  });

  it("an EMPTY data-slug does not win — falls through to the hostname", () => {
    injectAppJs({ "data-slug": "" });
    expect(siteSlug()).toBe(location.hostname.split(".")[0] || "site");
  });
});
