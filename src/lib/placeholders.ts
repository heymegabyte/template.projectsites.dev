/**
 * Placeholder scrubbing — the render-time firewall that stops an unresolved
 * generation token (e.g. `{ABOUT_HEADLINE}`, `{HERO_SUBHEADLINE}`,
 * `{ABOUT_IMAGE_URL}`) from ever reaching the DOM.
 *
 * @remarks
 * The template ships every page with literal `{TOKEN}` strings that the AI
 * generation step string-replaces with real copy (see `src/pages/*.tsx`). When
 * that step fails, only partially runs, or a token is simply forgotten, the raw
 * `{TOKEN}` used to render verbatim in the shipped SPA — headings read
 * "{ABOUT_HEADLINE}", bullet lists showed "{ABOUT_BULLET_1}", and an
 * `<img src="{ABOUT_IMAGE_URL}">` fired a guaranteed 404. A whole build shipped
 * this way and scored 2.8/10 (journey 2026-08-20): the good server-rendered
 * shell was overwritten at hydration by these unpopulated tokens.
 *
 * This mirrors the self-healing already done for BRAND data in `src/brand.ts`
 * (`pick()` rejects `{BUSINESS_NAME}`-shaped leaves). Here we do the same for
 * every user-facing PAGE prop, at the section-component boundary, so the fix is
 * template-side and structural — it works on EVERY generated site regardless of
 * how the generation step behaves. Pure functions, no side effects.
 *
 * The contract: a scrubbed placeholder becomes `''` (empty), and every section
 * component already guards its optional text with `{value && <h2>…</h2>}` /
 * `{description && <p>…</p>}`, so an empty string simply HIDES that element
 * instead of printing a token. Images with a placeholder `src` are dropped
 * entirely (via {@link hasRealImage}) so no broken 404 box renders.
 */

/**
 * A generation token that survived to runtime — one of:
 *
 *   - a bare token: `{ABOUT_HEADLINE}`, `{TIER_1_NAME}`
 *   - a token embedded in a wrapper: `https://{ABOUT_IMAGE_URL}`, `— {FOO} —`
 *   - a token with digits/dots: `{FAQ_1_Q}`, `{color.brandHue}`
 *
 * The shipped tokens are ALL-CAPS snake with optional digits (e.g.
 * `ABOUT_STAT_1_VALUE`), plus a few dotted brand refs (`{color.brandHue}`).
 * The pattern is deliberately broad enough to catch both while never matching
 * ordinary prose that happens to contain braces (rare on a marketing site, and
 * caught only when the braces wrap a token-shaped identifier).
 */
const PLACEHOLDER_RE = /\{[A-Za-z][A-Za-z0-9_.]*\}/;

/**
 * Leaked GENERATION-PLAN / INSTRUCTION prose — the second class of junk that
 * must never reach the DOM. Distinct from a `{TOKEN}`: this is real-looking
 * English that is actually the model's own section plan or prompt scaffolding
 * bleeding into user copy.
 *
 * @remarks
 * A whole build shipped with the raw section plan as its hero paragraph AND its
 * `<meta description>`, truncated mid-word: "…Sections: Hero, About our
 * roastery, Services (espresso bar, whol" (journey 2026-08-21, scored 2.2/10).
 * The `{TOKEN}` scrubber missed it because leaked-plan text has no braces — it
 * is ordinary prose. These patterns catch the tells of a plan/instruction leak
 * so the hero falls back to the business name and the meta/subline hide instead.
 *
 * Deliberately narrow — each pattern targets a structural tell of generation
 * scaffolding (a "Sections:" list, "# System"/"# User" prompt headers, "As an
 * AI"/"language model" refusals, a bare "Here is/are the …" preamble), NOT
 * ordinary marketing copy. A real business sentence never opens with these.
 */
const LEAKED_PLAN_RES: readonly RegExp[] = [
  // "Sections: Hero, About, Services…" — the exact leak that shipped.
  /\bsections?\s*:\s*(?:hero|about|services|home|contact|the\b)/i,
  // A plan/outline preamble: "The site will have the following sections", "Here are the sections".
  /\b(?:following|these)\s+sections\b/i,
  /\bhere\s+(?:is|are)\s+the\s+(?:sections?|pages?|plan|content|outline|website|copy)\b/i,
  // Prompt-scaffolding headers that leak from the .prompt.md format.
  /(?:^|\n)\s*#{1,3}\s*(?:system|user|assistant|task|instructions?|output)\b/i,
  /\b(?:you\s+are\s+an?\s+(?:elite|expert|ai|assistant)|as\s+an\s+ai|language\s+model)\b/i,
  // A meta narration of the build rather than the business.
  /\b(?:this\s+(?:website|site|page)\s+(?:will|should)\s+(?:have|include|contain|feature))\b/i,
];

/**
 * True when a value looks like leaked generation-plan / prompt-instruction prose
 * (see {@link LEAKED_PLAN_RES}). Used alongside the `{TOKEN}` check so both
 * classes of junk are firewalled at the same boundary.
 *
 * @param value - the candidate string (any type accepted for ergonomics)
 * @returns whether the value reads as a leaked plan / instruction
 *
 * @example
 * isLeakedPlanText('Sections: Hero, About our roastery, Services (espresso') // → true
 * isLeakedPlanText('# System\nYou are an elite web designer')                 // → true
 * isLeakedPlanText('Small-batch coffee roasted in Asheville since 2009')      // → false
 */
export function isLeakedPlanText(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return LEAKED_PLAN_RES.some((re) => re.test(value));
}

/**
 * True when a value is an unresolved generation placeholder that must not reach
 * the DOM — EITHER a `{TOKEN}` OR leaked generation-plan / instruction prose.
 *
 * A value is a placeholder when it is a string that is EITHER exactly a single
 * token (optionally surrounded by whitespace) OR contains a token anywhere OR
 * reads as leaked plan/instruction text. `null`/`undefined`/non-strings are not
 * placeholders (callers pass those through to their own defaults).
 *
 * @param value - the candidate string (any type accepted for ergonomics)
 * @returns whether the value is (or contains) an unresolved `{TOKEN}` or leaked plan text
 *
 * @example
 * isPlaceholder('{ABOUT_HEADLINE}')            // → true
 * isPlaceholder('https://{ABOUT_IMAGE_URL}')   // → true (embedded)
 * isPlaceholder('Sections: Hero, About, Serv') // → true (leaked plan)
 * isPlaceholder('Fresh sourdough, daily')      // → false
 * isPlaceholder('')                            // → false (empty, not a token)
 * isPlaceholder(undefined)                     // → false
 */
export function isPlaceholder(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return PLACEHOLDER_RE.test(value) || isLeakedPlanText(value);
}

/**
 * Scrub a single text prop: return the real string, or `fallback` when the
 * value is an unresolved placeholder / empty / non-string.
 *
 * Pass no `fallback` (default `''`) for OPTIONAL text — the section component's
 * own `{value && …}` guard then hides the element. Pass a real fallback for
 * text that must always render (e.g. a CTA label, a hero headline).
 *
 * @param value - the candidate string
 * @param fallback - what to return when `value` is a placeholder/empty (default `''`)
 * @returns the trimmed real value, or `fallback`
 *
 * @example
 * scrubText('{ABOUT_HEADLINE}')                 // → ''  (hidden by caller guard)
 * scrubText('{HERO_CTA}', 'Get started')        // → 'Get started'
 * scrubText('  Real copy  ')                    // → 'Real copy'
 * scrubText(undefined, 'Learn more')            // → 'Learn more'
 */
export function scrubText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallback;
  if (isPlaceholder(trimmed)) return fallback;
  return trimmed;
}

/**
 * Parse the CITY from a business address, robust to BOTH a compact Google-Places
 * `formattedAddress` (`"1517 Polk St, San Francisco, CA 94109"` → `"San Francisco"`)
 * AND a verbose OSM/Nominatim `display_name`
 * (`"Swan Oyster Depot, 1517, Polk Street, …, San Francisco, California, 94109, United States"`
 * → `"San Francisco"`).
 *
 * @remarks
 * The naive "second comma field" heuristic this replaces grabbed the STREET NUMBER
 * (`"1517"`) out of an OSM `display_name` — leaking a bare number into `<title>` and
 * `<meta description>` on every OSM-sourced site's sub-pages
 * ("Proudly serving 1517 …", "… · 1517 · get in touch to learn more"). Mirrors the
 * worker's `hero_copy.ts` `cityFromAddress` (AL-733b) so the H1 and the SEO title/meta
 * derive the SAME city. Works from the END of the comma fields — dropping country →
 * postcode → state → administrative-area — then takes the last remaining city-like
 * field; rejects a pure-number field so a street number / ZIP can never survive as the
 * "city". Returns `''` when no real city is found (callers then skip the city pad rather
 * than print junk). Pure — same input, same output.
 *
 * @param address - the business address (Places or OSM shape), may be null/undefined
 * @returns the city name, or `''` when none can be confidently parsed
 * @example cityFromAddress('Swan Oyster Depot, 1517, Polk Street, San Francisco, California, 94109, United States') // → 'San Francisco'
 * @example cityFromAddress('1517 Polk St, San Francisco, CA 94109') // → 'San Francisco'
 * @example cityFromAddress('') // → ''
 */
export function cityFromAddress(address: string | null | undefined): string {
  const parts = (address || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return '';
  const at = (k: number): string => parts[k] ?? '';
  const COUNTRY =
    /^(united states(?: of america)?|usa|u\.?s\.?a?\.?|canada|united kingdom|uk|australia|england|scotland|wales)$/i;
  // ZIP / ZIP+4 / "NY 10002" (state+ZIP) / Canadian "A1A 1A1" / UK-ish alnum postcodes.
  const POSTCODE = /^(?:[A-Za-z]{2}\s+)?\d{4,6}(?:-\d{4})?$|^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
  const ADMIN =
    /\b(county|community board|borough|district|province|parish|census|metropolitan|greater|region|township|prefecture)\b/i;
  // Full US state / DC / common CA-province names — OSM display_names spell the state out
  // ("…, San Francisco, California, 94110, …"), so a ZIP-only drop would leave "California".
  const STATE =
    /^(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia|ontario|quebec|british columbia|alberta|manitoba|saskatchewan|nova scotia|new brunswick)$/i;
  // A street line (house number / road suffix) — the field BEFORE a candidate state in a
  // COMPACT "179 E Houston St, New York, NY 10002" address, where "New York" is the CITY.
  const STREETISH =
    /\d|\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pl|place|hwy|highway|pkwy|suite|ste|fl|floor|unit)\b/i;
  let i = parts.length - 1;
  // Drop trailing country + postcode.
  while (i >= 0 && (COUNTRY.test(at(i)) || POSTCODE.test(at(i)))) i--;
  // Drop a trailing full-state / bare-2-letter-state — but ONLY when the field before it is
  // another locality (not the street line): a verbose "…, San Francisco, California, …" drops
  // the STATE to reveal "San Francisco", while a compact "…St, New York, NY 10002" KEEPS the
  // CITY "New York" (its predecessor is the street, so "New York" is the city, not the state).
  if (i >= 1 && (STATE.test(at(i)) || /^[A-Za-z]{2}$/.test(at(i))) && !STREETISH.test(at(i - 1))) i--;
  // Drop administrative-area names between the state and the city ("Travis County").
  while (i >= 1 && ADMIN.test(at(i))) i--;
  const city = i >= 0 ? at(i) : '';
  // A real city has letters and is NOT a bare number (a street number / ZIP).
  if (city && /[A-Za-z]{2,}/.test(city) && !/^\d+$/.test(city)) return city;
  return '';
}

/**
 * Guarantee a meta description in the SEO sweet spot (120–156 chars) — the
 * `meta.description_length` build invariant. Generation reliably fills a rich
 * HOMEPAGE description but often ships SHORT sub-page ones (`{ABOUT_META_DESCRIPTION}`
 * etc. land 70–118 chars). When the (already-scrubbed) description is under 120,
 * this pads it with REAL brand copy only — the tagline, then "serving <City>"
 * parsed from the address, then a neutral CTA — never a fabricated claim — and
 * clamps to ≤156 at a word boundary. A description already ≥120 is returned as-is
 * (only clamped if it somehow exceeds 156). Mirrors the live local-SEO title
 * padding lever. Pure — same inputs, same output.
 *
 * @param description - the scrubbed page description (may be short)
 * @param business - brand business fields (`name`, `tagline`, `address`)
 * @returns a description whose length is in [120, 156] whenever any real brand copy exists
 * @example
 * fitMetaDescription('About our team.', { name: 'Cedar Ridge', tagline: '', address: '..., Boise, ID' })
 * // → 'About our team. Proudly serving Boise and the surrounding area. Learn more about Cedar Ridge…'
 */
export function fitMetaDescription(
  description: string,
  business: { name?: string; tagline?: string; address?: string },
): string {
  const MIN = 120;
  const MAX = 156;
  const clampMax = (s: string): string => {
    if (s.length <= MAX) return s;
    const cut = s.slice(0, MAX);
    const sp = cut.lastIndexOf(' ');
    return sp > MIN - 2 ? cut.slice(0, sp) : cut;
  };

  let d = (description || '').trim();
  if (d.length >= MIN) return clampMax(d);

  const city = cityFromAddress(business.address);
  const pads = [
    (business.tagline || '').trim(),
    city ? `Proudly serving ${city} and the surrounding area.` : '',
    business.name ? `Learn more about ${business.name} and get in touch today.` : '',
    // Long neutral last-resort so a minimal brand (no tagline, no address) still
    // clears the 120 floor from a short base + name alone.
    'Get in touch with our team today to learn more about our services and how we can help you.',
  ].filter((s): s is string => s.length > 0);

  for (const pad of pads) {
    if (d.length >= MIN) break;
    if (d.includes(pad)) continue;
    const prefix = d.length === 0 ? '' : /[.!?]$/.test(d) ? ' ' : '. ';
    // Append token-by-token so we approach — but never overshoot — MAX. STOP at
    // the first word that won't fit (break, not skip) — skipping an interior word
    // while keeping its spaces produced broken grammar + a double space
    // ("…and the  area." instead of "…and the surrounding area.").
    for (const tok of (prefix + pad).split(/(\s+)/)) {
      if (d.length >= MAX) break;
      if ((d + tok).length <= MAX) d += tok;
      else break;
    }
  }

  // Collapse any stray double space, then strip a dangling trailing connector
  // ("…serving Portland and the") left when a pad was cut mid-phrase, so a
  // partially-appended pad always ends on a real word.
  d = d
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,;:-]+$/, '')
    .replace(/(?:\s+(?:and|the|a|an|of|to|for|with|in|on|at|or|&|but))+$/i, '');
  d = clampMax(d);
  if (!/[.!?]$/.test(d) && d.length < MAX) d += '.';
  return d;
}

/**
 * Guarantee a page `<title>` in the SEO sweet spot (50–60 chars) — the
 * `meta.title_length` build invariant. Generation pads the HOMEPAGE title (the
 * local-SEO "| City" append) but ships SHORT sub-page titles ("About — {Business}"
 * ≈ 15–20 chars). When a (scrubbed) title is under 50, this appends REAL brand
 * copy only — the tagline, then the city parsed from the address, then a neutral
 * suffix — separated by " · ", and clamps to ≤60 at a word boundary. A title
 * already ≥50 passes through (clamped only if it exceeds 60). Mirrors
 * {@link fitMetaDescription}. Pure — same inputs, same output.
 *
 * @param title - the scrubbed page title (may be short)
 * @param business - brand business fields (`name`, `tagline`, `address`)
 * @returns a title whose length is in [50, 60] whenever any real brand copy exists
 * @example fitMetaTitle('About — Ada Co', { tagline: 'Design that ships', address: '..., Austin, TX' })
 * // → 'About — Ada Co · Design that ships · Austin'
 */
export function fitMetaTitle(
  title: string,
  business: { name?: string; tagline?: string; address?: string },
): string {
  const MIN = 50;
  const MAX = 60;
  // Strip a dangling separator / stop-word connector left when a title is cut at a
  // word boundary, so it never ends on "… —" / "… ·" / "… for" / "… and". Applied on
  // EVERY clamp (both the pad path AND the already-long early-return) — the sub-page
  // "{Page} {Name} — {Tagline}" overflow case cut a long tagline mid-phrase and kept
  // the dangling connector (e.g. "… Trusted Primary Care for") because the old strip
  // ran only after padding. Covers en/em dashes too (the sub-page " — " separator).
  const stripDangling = (s: string): string =>
    s
      .replace(/(?:\s*[·|,;:—–-]\s*)+$/g, '')
      .replace(/(?:\s+(?:and|the|a|an|of|to|for|with|in|on|at|or|&|but))+$/i, '')
      .trim();
  const clampMax = (s: string): string => {
    if (s.length <= MAX) return stripDangling(s);
    const cut = s.slice(0, MAX);
    const sp = cut.lastIndexOf(' ');
    let out = sp > MIN - 2 ? cut.slice(0, sp) : cut;
    // We DID truncate, so a trailing "<stop-word> <word>" ("… Primary Care for Every")
    // is a cut-off phrase (the real end, "… Age", was dropped) — drop the whole tail so
    // the title ends on a complete thought. Only fires on a genuine clamp, so a complete
    // title that merely CONTAINS "for X" (e.g. "Care for Kids", which fit under MAX and
    // took the branch above) is never touched.
    // Include subordinating conjunctions (when/while/where) — a clamped tagline like
    // "Trusted Counsel When It Matters" cuts to "… Counsel When It", a dangling
    // dependent clause; drop it to "… Counsel". Fires only on a genuine clamp, so a
    // COMPLETE in-range "Care When You Need It" (took the ≤MAX branch) is never touched.
    out = out.replace(/\s+(?:and|the|a|an|of|to|for|with|in|on|at|or|when|while|where)\s+\S+$/i, '');
    out = stripDangling(out);
    // A truncated comma-separated tagline ("Ship Faster, Skip the Busywork" → cut to
    // "… Ship Faster, Skip") leaves a dangling SINGLE-word clause after the last comma —
    // drop it back to the last complete clause ("… Ship Faster"). Clamp-only +
    // exactly-one-word-after-the-last-comma, so a COMPLETE "Fast, Reliable Service"
    // (which took the ≤MAX branch) is never touched; the 24-char floor guards against
    // gutting a short title. Composes with the city refill below → "… Ship Faster · Seattle".
    const commaDropped = out.replace(/,\s+\S+$/, '');
    if (commaDropped !== out && commaDropped.length >= 24) out = stripDangling(commaDropped);
    return out;
  };

  const city = cityFromAddress(business.address);

  let t = (title || '').trim();
  if (t.length >= MIN) {
    const clamped = clampMax(t);
    // If clamping a long "{Name} — {Tagline}" dropped us below the sweet spot (the
    // tagline got truncated away), refill with the CITY — the "{business} … {city}"
    // local-SEO signal. The tagline is already present (clamped), so re-padding it
    // would duplicate; the city is the right, non-redundant pad. Only when it fits ≤MAX.
    if (clamped.length < MIN && city && !clamped.includes(city)) {
      const withCity = `${clamped} · ${city}`;
      if (withCity.length <= MAX) return withCity;
    }
    return clamped;
  }

  const pads = [
    (business.tagline || '').trim(),
    city,
    // Generic, claim-free last-resort so a minimal brand (no tagline, no city)
    // still clears 50 without an awkward name-echo — mirrors fitMetaDescription.
    'get in touch to learn more about our work',
  ].filter((s): s is string => s.length > 0);

  for (const pad of pads) {
    if (t.length >= MIN) break;
    if (t.includes(pad)) continue;
    // Append token-by-token after a " · " separator; BREAK (not skip) at the first
    // word that won't fit, so a cut pad ends on a real word (never a mid-word slice)
    // — the same lesson as fitMetaDescription.
    for (const tok of ` · ${pad}`.split(/(\s+)/)) {
      if (t.length >= MAX) break;
      if ((t + tok).length <= MAX) t += tok;
      else break;
    }
  }

  // Collapse a stray double space + strip a dangling trailing separator / connector
  // ("… ·" / "…and") left when a pad was cut mid-phrase, so the title ends on a word.
  t = t
    .replace(/\s{2,}/g, ' ')
    .replace(/(?:\s*[·|,;:-]\s*)+$/g, '')
    .replace(/(?:\s+(?:and|the|a|an|of|to|for|with|in|on|at|or|&|but))+$/i, '')
    .trim();
  return clampMax(t);
}

/**
 * Scrub an array of text values, dropping every entry that is an unresolved
 * placeholder / empty / non-string. Preserves order of the survivors.
 *
 * Use for bullet lists, feature arrays, and any repeated text where a partial
 * generation should show the real items and silently omit the unfilled ones —
 * never render a `{ABOUT_BULLET_2}` next to real copy.
 *
 * @param values - candidate strings (undefined → treated as empty list)
 * @returns the real, trimmed strings only
 *
 * @example
 * scrubList(['Licensed & insured', '{ABOUT_BULLET_2}', 'Same-day quotes'])
 * // → ['Licensed & insured', 'Same-day quotes']
 * scrubList(['{ABOUT_BULLET_1}', '{ABOUT_BULLET_2}'])   // → []
 */
export function scrubList(values: readonly unknown[] | undefined | null): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const v of values) {
    const s = scrubText(v);
    if (s) out.push(s);
  }
  return out;
}

/**
 * True when an image `src` is a real, renderable source — NOT an unresolved
 * placeholder and not empty. Gate every `<img>` on this so a `{ABOUT_IMAGE_URL}`
 * (or empty `src`) never fires a 404 / renders a broken image box.
 *
 * @param src - the candidate image URL/path
 * @returns whether it is safe to render an `<img src>` for this value
 *
 * @example
 * hasRealImage('/images/team.jpg')      // → true
 * hasRealImage('{ABOUT_IMAGE_URL}')     // → false → drop the <img>
 * hasRealImage('')                      // → false
 * hasRealImage(undefined)               // → false
 */
export function hasRealImage(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  const t = src.trim();
  if (t.length === 0) return false;
  return !isPlaceholder(t);
}

/**
 * Scrub an `{ src, alt }` image descriptor. Returns the descriptor unchanged
 * (with a guaranteed non-placeholder `alt`) when the `src` is real, or
 * `undefined` when the `src` is a placeholder/empty — signalling the caller to
 * render NO image at all.
 *
 * @param image - the image descriptor, or undefined
 * @param fallbackAlt - alt text to use if the provided alt is itself a placeholder
 * @returns a safe descriptor, or `undefined` to render nothing
 *
 * @example
 * scrubImage({ src: '{ABOUT_IMAGE_URL}', alt: '{ABOUT_IMAGE_ALT}' })
 * // → undefined  (render no <img> — avoids the 404)
 * scrubImage({ src: '/team.jpg', alt: '{ABOUT_IMAGE_ALT}' }, 'Our team')
 * // → { src: '/team.jpg', alt: 'Our team' }
 */
export function scrubImage(
  image: { src: string; alt: string } | undefined | null,
  fallbackAlt = '',
): { src: string; alt: string } | undefined {
  if (!image || !hasRealImage(image.src)) return undefined;
  return { src: image.src.trim(), alt: scrubText(image.alt, fallbackAlt) };
}
