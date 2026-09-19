import { describe, it, expect, vi } from "vitest";

// cityFromAddress is exercised for real via placeholders; no need to mock brand here.
import { routeMetaDescription } from "./routeSeo";

const BIZ = {
  name: "Guelaguetza",
  shortName: "Guelaguetza",
  tagline: "Your neighborhood restaurant",
  description: "",
  url: "",
  businessClass: "restaurant",
  address: "3014 W Olympic Blvd, Los Angeles, CA 90006",
  email: "",
  phone: "",
  hours: "",
} as const;

describe("routeMetaDescription — per-route distinct, real-signal, token-free", () => {
  const routes = ["/", "/about", "/contact", "/services", "/menu", "/pricing"];

  it("returns a DISTINCT description for every route (no duplicate meta descriptions)", () => {
    const descs = routes.map((r) => routeMetaDescription(r, BIZ));
    expect(new Set(descs).size).toBe(routes.length); // all unique
  });

  it("weaves in the real business name + city (no fabrication)", () => {
    const about = routeMetaDescription("/about", BIZ);
    expect(about).toContain("Guelaguetza");
    expect(about).toContain("Los Angeles");
    expect(about.toLowerCase()).toContain("about");
  });

  it("never leaks a {TOKEN} and stays in a sane length band", () => {
    for (const r of routes) {
      const d = routeMetaDescription(r, BIZ);
      expect(d).not.toMatch(/\{[A-Z0-9_]{2,}\}/);
      expect(d.length).toBeGreaterThanOrEqual(90);
      expect(d.length).toBeLessThanOrEqual(180); // useSEO's fitMetaDescription clamps to 156
    }
  });

  it("degrades gracefully with no address (no dangling ' in ') and no name", () => {
    const noCity = routeMetaDescription("/about", { ...BIZ, address: "" });
    expect(noCity).not.toContain(" in  ");
    expect(noCity).not.toContain(" in —");
    const noName = routeMetaDescription("/contact", { ...BIZ, name: "", address: "" });
    expect(noName).toContain("our team"); // sensible default, never empty
  });

  it("an unknown route gets the default — still distinct from the homepage", () => {
    expect(routeMetaDescription("/programs", BIZ)).not.toBe(
      routeMetaDescription("/", BIZ),
    );
  });
});
