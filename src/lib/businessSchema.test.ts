import { describe, it, expect } from "vitest";
import {
  buildSiteJsonLd,
  buildBusinessJsonLd,
  describeToday,
  isOpenAt,
  type BusinessProfile,
} from "./businessSchema";

/**
 * AL-522 — the client-side JSON-LD dedup. The site-level WebSite / WebPage /
 * BreadcrumbList are injected SERVER-SIDE (worker build_validators shell injector);
 * buildSiteJsonLd must emit ONLY the rich business entity so the rendered DOM has no
 * duplicate WebSite / WebPage / BreadcrumbList (Google can't merge them — the server
 * blocks carry no @id, the old client copies did).
 */
const GYM: BusinessProfile = {
  name: "Vanta Strength Club",
  description: "A strength gym in Austin.",
  url: "https://vanta-strength-austin.projectsites.dev",
  businessClass: "gym",
  phone: "(512) 555-0100",
  address: {
    streetAddress: "100 Congress Ave",
    addressLocality: "Austin",
    addressRegion: "TX",
    postalCode: "78701",
    addressCountry: "US",
  },
  geo: { latitude: 30.26, longitude: -97.74 },
};

describe("buildSiteJsonLd (AL-522: client emits only the rich business entity, no server-owned dups)", () => {
  it("returns EXACTLY ONE node — the business entity", () => {
    const nodes = buildSiteJsonLd(GYM);
    expect(nodes).toHaveLength(1);
  });

  it("NEVER re-emits the server-owned site-level types (WebSite / WebPage / BreadcrumbList / WebSite dup)", () => {
    const types = buildSiteJsonLd(GYM).map((n) => n["@type"]);
    for (const owned of ["WebSite", "WebPage", "BreadcrumbList"]) {
      expect(types).not.toContain(owned); // the server injects these — re-emitting duplicated them
    }
  });

  it("emits the RICH LocalBusiness subtype the server lacks (ExerciseGym for a gym, with NAP + geo)", () => {
    const [org] = buildSiteJsonLd(GYM);
    expect(org["@type"]).toBe("ExerciseGym"); // the specific subtype, not a generic Organization
    expect(org["@id"]).toBe(`${GYM.url}#org`);
    expect((org.address as Record<string, unknown>)?.["@type"]).toBe(
      "PostalAddress",
    );
    expect((org.geo as Record<string, unknown>)?.["@type"]).toBe(
      "GeoCoordinates",
    );
    expect(org.telephone).toBe(GYM.phone);
  });

  it("is the same single rich entity buildBusinessJsonLd builds (no divergence)", () => {
    expect(buildSiteJsonLd(GYM)).toEqual([buildBusinessJsonLd(GYM)]);
  });

  it("has no duplicate @type within the returned graph (trivially true at length 1, guards future adds)", () => {
    const types = buildSiteJsonLd(GYM).map((n) => n["@type"]);
    expect(new Set(types).size).toBe(types.length);
  });

  it("a non-local class (saas) still yields exactly one entity, no site-level dups", () => {
    const saas = buildSiteJsonLd({
      ...GYM,
      businessClass: "saas",
      address: undefined,
      geo: undefined,
    });
    expect(saas).toHaveLength(1);
    expect(saas[0]["@type"]).toBe("SoftwareApplication");
  });
});

/**
 * Overnight-safe open-now (surfed this fire): a nightlife business "6pm–2am" (close 02:00 <= open
 * 18:00) was shown "Closed now" at 8pm (peak time!) and "Opens at 6pm" at 12:30am on every deployed
 * site — the naive `open <= now < close` check ignored the post-midnight span. isOpenAt / describeToday
 * had ZERO test coverage, which is why it hid. These lock the overnight branch + the standard case.
 */
describe("isOpenAt / describeToday — overnight-safe open-now (nightlife: 6pm–2am)", () => {
  const STD = "Mon–Fri 9am–5pm";
  const BAR = "Mon–Sun 6pm–2am"; // opens 18:00, closes 02:00 the next day

  it("standard hours: open during, closed before + after", () => {
    expect(isOpenAt(STD, "Monday", 10 * 60)).toBe(true); // 10:00
    expect(isOpenAt(STD, "Monday", 8 * 60)).toBe(false); // 08:00
    expect(isOpenAt(STD, "Monday", 18 * 60)).toBe(false); // 18:00
  });

  it("OVERNIGHT: open in the evening AND after midnight, closed in the afternoon", () => {
    expect(isOpenAt(BAR, "Friday", 20 * 60)).toBe(true); // 8pm — the peak-time bug (was false)
    expect(isOpenAt(BAR, "Friday", 30)).toBe(true); // 12:30am — still open (was false)
    expect(isOpenAt(BAR, "Friday", 15 * 60)).toBe(false); // 3pm — closed
    expect(isOpenAt(BAR, "Friday", 2 * 60)).toBe(false); // 2:00am exactly — closed (half-open)
  });

  it("describeToday standard: opens-later / open-now / closed", () => {
    expect(describeToday(STD, "Monday", 8 * 60)).toEqual({
      open: false,
      label: "Opens today at 9am",
    });
    expect(describeToday(STD, "Monday", 10 * 60)).toEqual({
      open: true,
      label: "Open now · until 5pm",
    });
    expect(describeToday(STD, "Monday", 18 * 60)).toEqual({
      open: false,
      label: "Closed now",
    });
  });

  it('describeToday OVERNIGHT: "Open now · until 2am" at 8pm AND 12:30am; "Opens today at 6pm" at 3pm', () => {
    expect(describeToday(BAR, "Friday", 20 * 60)).toEqual({
      open: true,
      label: "Open now · until 2am",
    });
    expect(describeToday(BAR, "Friday", 30)).toEqual({
      open: true,
      label: "Open now · until 2am",
    });
    expect(describeToday(BAR, "Friday", 15 * 60)).toEqual({
      open: false,
      label: "Opens today at 6pm",
    });
  });
});
