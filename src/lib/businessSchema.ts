export type BusinessClass =
  | "storefront"
  | "restaurant"
  | "medical"
  | "dental"
  | "wellness"
  | "retail"
  | "salon"
  | "gym"
  | "fitness"
  | "auto-repair"
  | "local-service"
  | "real-estate"
  | "saas"
  | "portfolio"
  | "nonprofit"
  | "legal"
  | "organization";

// Physically-located businesses → get the LocalBusiness subtype + geo + openingHours +
// priceRange. Every loop vertical except saas/portfolio/organization has a real address,
// so all of them are local (a law firm, clinic, and food bank all have a findable office).
const LOCAL_BUSINESS_CLASSES: ReadonlySet<BusinessClass> = new Set([
  "storefront",
  "restaurant",
  "medical",
  "dental",
  "wellness",
  "retail",
  "salon",
  "gym",
  "fitness",
  "auto-repair",
  "local-service",
  "real-estate",
  "nonprofit",
  "legal",
]);

// Specific Schema.org LocalBusiness subtypes (richer than the generic 'LocalBusiness')
// so Google's rich-results/local-pack shows the right entity. Each is a real schema.org
// type. saas → SoftwareApplication (not local).
const TYPE_OVERRIDES: Partial<Record<BusinessClass, string>> = {
  restaurant: "Restaurant",
  medical: "MedicalBusiness",
  dental: "Dentist",
  wellness: "HealthAndBeautyBusiness",
  retail: "Store",
  salon: "BeautySalon",
  gym: "ExerciseGym",
  fitness: "ExerciseGym",
  "auto-repair": "AutoRepair",
  "local-service": "HomeAndConstructionBusiness",
  "real-estate": "RealEstateAgent",
  legal: "LegalService",
  nonprofit: "NGO",
  saas: "SoftwareApplication",
};

export interface BusinessProfile {
  name: string;
  description: string;
  url: string;
  businessClass: BusinessClass;
  logo?: string;
  email?: string;
  phone?: string;
  sameAs?: string[];
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: { latitude: number; longitude: number };
  openingHours?: Array<string | Record<string, unknown>>;
  priceRange?: string;
  founder?: { name: string; jobTitle?: string; sameAs?: string[] };
  foundingDate?: string;
}

export function buildBusinessJsonLd(
  profile: BusinessProfile,
): Record<string, unknown> {
  const isLocal = LOCAL_BUSINESS_CLASSES.has(profile.businessClass);
  const type =
    TYPE_OVERRIDES[profile.businessClass] ??
    (isLocal ? "LocalBusiness" : "Organization");

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${profile.url}#org`,
    name: profile.name,
    description: profile.description,
    url: profile.url,
  };
  if (profile.logo) base.logo = profile.logo;
  if (profile.email) base.email = profile.email;
  if (profile.phone) base.telephone = profile.phone;
  if (profile.sameAs?.length) base.sameAs = profile.sameAs;
  if (profile.foundingDate) base.foundingDate = profile.foundingDate;
  if (profile.founder) {
    base.founder = {
      "@type": "Person",
      name: profile.founder.name,
      ...(profile.founder.jobTitle
        ? { jobTitle: profile.founder.jobTitle }
        : {}),
      ...(profile.founder.sameAs?.length
        ? { sameAs: profile.founder.sameAs }
        : {}),
    };
  }
  if (profile.address) {
    base.address = {
      "@type": "PostalAddress",
      streetAddress: profile.address.streetAddress,
      addressLocality: profile.address.addressLocality,
      addressRegion: profile.address.addressRegion,
      postalCode: profile.address.postalCode,
      addressCountry: profile.address.addressCountry,
    };
  }
  if (isLocal && profile.geo) {
    base.geo = {
      "@type": "GeoCoordinates",
      latitude: profile.geo.latitude,
      longitude: profile.geo.longitude,
    };
  }
  if (isLocal && profile.openingHours?.length)
    base.openingHoursSpecification = profile.openingHours;
  if (isLocal && profile.priceRange) base.priceRange = profile.priceRange;
  return base;
}

/**
 * Build the CLIENT-side per-page JSON-LD — ONLY the rich business entity (the
 * LocalBusiness subtype carrying NAP + geo + openingHours + priceRange).
 *
 * @remarks
 * AL-522: the site-level `WebSite` / `WebPage` / `BreadcrumbList` are injected
 * SERVER-SIDE into every served page (the worker `build_validators.ts` shell
 * injector — the no-JS baseline + the ≥4-block invariant). This component used to
 * re-emit those THREE types client-side too, so the rendered DOM ended up with each
 * one TWICE — and because the server blocks carry NO `@id` while these did
 * (`#website`/`#webpage`), Google couldn't merge them → duplicate WebSite / WebPage /
 * BreadcrumbList entities on every page (a real structured-data hygiene defect; the
 * served HTML was already clean — the dup was client-only). Returning ONLY the rich
 * business entity removes the duplication while KEEPING the valuable client-rendered
 * NAP/geo/hours (the server's generic `Organization` block lacks them). Still an array
 * so `<JsonLd data={...} />` consumers are unchanged.
 */
export function buildSiteJsonLd(
  profile: BusinessProfile,
): Record<string, unknown>[] {
  return [buildBusinessJsonLd(profile)];
}

export function isLocalBusinessClass(value: BusinessClass): boolean {
  return LOCAL_BUSINESS_CLASSES.has(value);
}

/**
 * Parse a free-text US address string ("300 S 16th St, Omaha, NE 68102") into the
 * structured `PostalAddress` shape `buildBusinessJsonLd` needs. `brand.business.address`
 * ships as a single string, so without this the LocalBusiness JSON-LD emits NO address —
 * the single biggest local-SEO gap (Google's local pack keys on the structured address).
 *
 * Defensive: returns `undefined` for anything without at least a locality (online-only /
 * placeholder builds → no address node, never a malformed one). Pure.
 *
 * @example parseAddress('300 S 16th St, Omaha, NE 68102')
 * // → { streetAddress: '300 S 16th St', addressLocality: 'Omaha', addressRegion: 'NE', postalCode: '68102', addressCountry: 'US' }
 */
export function parseAddress(
  raw?: string,
): BusinessProfile["address"] | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return undefined; // need at least "Street, City" or "City, ST ZIP"
  const last = parts[parts.length - 1];
  const stZip = last.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/); // "NE 68102"
  let addressRegion = "";
  let postalCode = "";
  let localityIdx = parts.length - 1;
  if (stZip) {
    addressRegion = stZip[1].toUpperCase();
    postalCode = stZip[2];
    localityIdx = parts.length - 2;
  } else if (/^[A-Za-z]{2}$/.test(last)) {
    addressRegion = last.toUpperCase();
    localityIdx = parts.length - 2;
  } else if (/^\d{5}(?:-\d{4})?$/.test(last)) {
    postalCode = last;
    localityIdx = parts.length - 2;
  }
  const addressLocality = localityIdx >= 0 ? parts[localityIdx] : "";
  const streetAddress =
    localityIdx > 0 ? parts.slice(0, localityIdx).join(", ") : "";
  if (!addressLocality && !streetAddress) return undefined;
  return {
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode,
    addressCountry: "US",
  };
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/** "7am" | "7:30pm" | "12pm" → "HH:MM" (24h), or null when unparseable. */
function to24h(t: string): string | null {
  const m = t
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!m) return null;
  let h = Number(m[1]);
  if (h < 1 || h > 12) return null;
  if (m[3] === "pm" && h !== 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[2] ?? "00"}`;
}

/**
 * Parse the free-text `hours` string ("Wed–Sun 7am–3pm · Closed Mon & Tue") into
 * schema.org `OpeningHoursSpecification` objects for the LocalBusiness JSON-LD — the
 * signal Google shows in the local pack / knowledge panel. Handles the pack format
 * (`·`-separated "DayRange TimeRange" clauses, en-dash or hyphen ranges); SKIPS
 * closed/24-7/by-appointment notes; returns `[]` for anything unparseable (omit, never
 * emit malformed hours — a bad node can void the whole entity). Pure.
 *
 * @example parseHours('Mon–Fri 9am–5pm')
 * // → [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday'..'Friday'], opens: '09:00', closes: '17:00' }]
 */
export function parseHours(raw?: string): Array<Record<string, unknown>> {
  if (!raw || typeof raw !== "string") return [];
  const out: Array<Record<string, unknown>> = [];
  for (const clause of raw
    .split(/[·|,;]/)
    .map((c) => c.trim())
    .filter(Boolean)) {
    if (/closed|24\s*\/\s*7|emergency|appointment|by appt/i.test(clause))
      continue;
    const m = clause.match(
      /^([A-Za-z]{3})\s*(?:[–—-]\s*([A-Za-z]{3}))?\s+(\d{1,2}(?::\d{2})?\s*[ap]m)\s*[–—-]\s*(\d{1,2}(?::\d{2})?\s*[ap]m)$/i,
    );
    if (!m) continue;
    const start = DAY_INDEX[m[1].toLowerCase()];
    const end = m[2] ? DAY_INDEX[m[2].toLowerCase()] : start;
    const opens = to24h(m[3]);
    const closes = to24h(m[4]);
    if (start === undefined || end === undefined || !opens || !closes) continue;
    const days: string[] = [];
    for (let i = start, guard = 0; guard < 8; i = (i + 1) % 7, guard++) {
      days.push(DAY_NAMES[i]);
      if (i === end) break;
    }
    out.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: days,
      opens,
      closes,
    });
  }
  return out;
}

/** One row of the visible weekly-hours grid. `closed` days carry no opens/closes. */
export interface DayHours {
  day: string;
  opens?: string;
  closes?: string;
  closed: boolean;
}

const WEEK_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * Flatten the free-text `hours` string into a Mon→Sun grid for the visible
 * "Hours" card — the human-readable twin of {@link parseHours}'s JSON-LD, built
 * from the SAME parse so display and structured data can never disagree. Days not
 * named in any clause render as `closed`. Returns `[]` when nothing parses (e.g.
 * "By appointment only") so the caller can fall back to showing the raw string.
 *
 * @example hoursToWeek('Mon–Fri 9am–5pm')
 * // → [{day:'Monday',opens:'09:00',closes:'17:00',closed:false}, … , {day:'Sunday',closed:true}]
 */
export function hoursToWeek(raw?: string): DayHours[] {
  const specs = parseHours(raw);
  if (!specs.length) return [];
  const map = new Map<string, { opens: string; closes: string }>();
  for (const s of specs) {
    for (const d of s.dayOfWeek as string[])
      map.set(d, { opens: s.opens as string, closes: s.closes as string });
  }
  return WEEK_ORDER.map((day) => {
    const h = map.get(day);
    return h
      ? { day, opens: h.opens, closes: h.closes, closed: false }
      : { day, closed: true };
  });
}

/**
 * Is the business open at `dayName` + `minutes` (minutes since local midnight)?
 * Pure — the caller passes a `new Date()`-derived day/time, so the fn stays
 * deterministic + unit-testable. `false` when the day is closed or unparseable.
 *
 * @example isOpenAt('Mon–Fri 9am–5pm', 'Monday', 600) // 10:00 → true
 */
export function isOpenAt(
  raw: string | undefined,
  dayName: string,
  minutes: number,
): boolean {
  const d = hoursToWeek(raw).find((x) => x.day === dayName);
  if (!d || d.closed || !d.opens || !d.closes) return false;
  const [oh, om] = d.opens.split(":").map(Number);
  const [ch, cm] = d.closes.split(":").map(Number);
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  // Overnight span (e.g. a bar 6pm–2am: close 02:00 <= open 18:00) is open from `open` today
  // THROUGH the post-midnight `close` — so "open" if after opening OR before that early close.
  return close <= open
    ? minutes >= open || minutes < close
    : minutes >= open && minutes < close;
}

/** "08:00" → "8am", "14:30" → "2:30pm", "00:00" → "12am". Display-only. */
export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${h12}${period}`
    : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

/**
 * Richer one-line "today" status for the hours chip — tells the visitor WHEN, not
 * just IF: open (with closing time), opening later today, or closed. Pure — caller
 * passes a `new Date()`-derived day + minutes-since-midnight. `null` when hours are
 * unparseable so the chip stays hidden (the grid falls back to the raw line).
 *
 * @example describeToday('Mon–Fri 9am–5pm', 'Monday', 600) // 10:00
 * // → { open: true, label: 'Open now · until 5pm' }
 */
export function describeToday(
  raw: string | undefined,
  dayName: string,
  minutes: number,
): { open: boolean; label: string } | null {
  const week = hoursToWeek(raw);
  if (!week.length) return null;
  const d = week.find((x) => x.day === dayName);
  if (!d || d.closed || !d.opens || !d.closes)
    return { open: false, label: "Closed today" };
  const [oh, om] = d.opens.split(":").map(Number);
  const [ch, cm] = d.closes.split(":").map(Number);
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  const overnight = close <= open; // closes after midnight (e.g. 6pm–2am)
  const isOpen = overnight
    ? minutes >= open || minutes < close
    : minutes >= open && minutes < close;
  if (isOpen)
    return { open: true, label: `Open now · until ${formatTime12(d.closes)}` };
  // Not open: BEFORE today's opening (still to come today) vs already CLOSED for the day. In the
  // overnight case, only the afternoon gap [close, open) is "before opening"; the early morning
  // (minutes < close) was already caught as open above.
  if (minutes < open)
    return { open: false, label: `Opens today at ${formatTime12(d.opens)}` };
  return { open: false, label: "Closed now" };
}
