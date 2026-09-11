/**
 * Brand source-of-truth resolver.
 *
 * Reads `_brand.json` (W3C DTCG format) at build time and exposes:
 *   - `brand`        — typed, alias-resolved object for use in components
 *   - `applyBrand()` — writes CSS custom properties to :root from the tokens
 *
 * Aliases like `oklch(0.62 {color.brandChroma} {color.brandHue})` are
 * resolved by recursive substitution before being written to CSS variables.
 * If a token references another token's value, this resolver handles it.
 */

import { resolvePreset, presetForClass, PRESET_NAMES, DEFAULT_PRESET, type PresetName } from './themePresets.ts';

// The shipped template carries _brand.json at the repo root. A FRESH build
// copy (e.g. the container's cp -r during site generation) can transiently
// miss it — the import then fails the whole build with a bare Node error
// (journey 2026-08-19: 'npm build failed or produced no dist/ files'). Use
// Vite's optional-glob import so a missing file degrades to {} instead —
// the per-field `pick` fallbacks below still resolve every surface.
const rawModules = import.meta.glob('../_brand.json', { eager: true });
const raw = (Object.values(rawModules)[0] ?? {}) as Record<string, unknown>;

type DtcgValue = string | number | boolean | unknown[] | Record<string, unknown>;
type DtcgNode = { $value: DtcgValue; $type?: string; $description?: string };
type DtcgTree = { [k: string]: DtcgNode | DtcgTree };

function isLeaf(v: unknown): v is DtcgNode {
  return typeof v === 'object' && v !== null && '$value' in v;
}

function getByPath(obj: unknown, dotted: string): unknown {
  return dotted.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function resolveString(value: string, root: unknown, depth = 0): string {
  if (depth > 8) return value;
  return value.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const node = getByPath(root, path);
    if (isLeaf(node)) {
      const v = node.$value;
      return typeof v === 'string' ? resolveString(v, root, depth + 1) : String(v);
    }
    return `{${path}}`;
  });
}

// Exported for the depth-guard regression test (AL-338); otherwise module-internal.
export function resolveTree(node: DtcgTree | DtcgNode, root: unknown, depth = 0): unknown {
  // Depth guard (AL-338) — mirrors resolveString's `depth > 8` discipline. Real
  // brand token trees are SHALLOW (~3-4 levels: business/color/font/radius/…),
  // but the AI build occasionally emits a MALFORMED `_brand.json` with runaway
  // nesting. This fn runs at MODULE LOAD (`resolveTree(raw, raw)` below, top-level,
  // BEFORE React + BEFORE applyBrand), so a deep tree recursing past the JS stack
  // limit throws an UNCAUGHT RangeError during bundle eval → the app never mounts,
  // hydration dies to a prerender-only shell, `data-style` never applies, and the
  // ErrorBoundary can't catch it (the throw is outside the React tree). Root cause
  // of the studio-q/methodical `fh→mh→mh…` crashes (crash ⟺ data-style:null). Cap
  // at 32 (8× any legitimate brand depth) so real brands are untouched; a
  // too-deep branch degrades to the raw node instead of crashing the whole site.
  if (depth > 32) return node;
  if (isLeaf(node)) {
    const v = node.$value;
    return typeof v === 'string' ? resolveString(v, root, 0) : v;
  }
  const out: Record<string, unknown> = {};
  for (const [k, child] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    out[k] = resolveTree(child as DtcgTree | DtcgNode, root, depth + 1);
  }
  return out;
}

const resolved = resolveTree(raw as unknown as DtcgTree, raw) as Record<string, unknown>;

export interface Brand {
  business: {
    name: string;
    shortName: string;
    tagline: string;
    description: string;
    url: string;
    businessClass: string;
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  color: Record<string, string | number>;
  colorScheme: 'dark' | 'light' | 'auto';
  /** Visual personality preset (font pairing + radius + shadow + motion + flourish). */
  themeStyle: PresetName;
  font: { heading: string; body: string; mono: string; weights: number[]; fluidScale: string };
  radius: Record<string, string>;
  spacing: Record<string, string>;
  shadow: Record<string, string>;
  motion: {
    easing: string;
    duration: { fast: string; base: string; slow: string; scroll: string };
  };
  layout: Record<string, string>;
  social: Record<string, string>;
  features: Record<string, boolean>;
}

// DTCG leaves that shipped UNRESOLVED (e.g. `{BUSINESS_NAME}` never
// substituted) would otherwise surface as "Business"/empty to the customer.
// Fall back per-field so a partially-materialized brand file still shows the
// real business name wherever the workflow DID provide one. (Journey defect
// 2026-08-19: a whole pipeline shipped as "Business" for 2 builds.)
const rawBusiness = (resolved as { business?: Record<string, unknown> }).business ?? {};
const pick = (key: string, fallback: string): string => {
  const v = rawBusiness[key];
  if (typeof v !== 'string') return fallback;
  const t = v.trim();
  // Reject EMPTY and PLACEHOLDER-shaped values: the shipped _brand.json has
  // {BUSINESS_NAME}-style leaves that the DTCG resolver outputs as literal
  // strings — a valid-looking leaf that is NOT real content. (Journey 2026-08-19:
  // a whole build shipped these placeholders live; the worker-side validator
  // caught it, this makes the template side self-healing.)
  if (t.length === 0) return fallback;
  if (/^\{[A-Z_]+\}$/.test(t)) return fallback;
  return t;
};
/**
 * Collapse the `..projectsites.dev` double-dot hostname in a business URL.
 *
 * The build LLM writes the canonical as `https://<slug>..projectsites.dev`
 * (slug already dot-suffixed in its model). Consumers (JSON-LD, OG, canonical)
 * embed `brand.business.url` verbatim, so normalize it at resolution time —
 * template-side self-healing, no LLM compliance involved. Pure.
 *
 * @example
 * normalizeUrl('https://urban-fitness..projectsites.dev/') // → 'https://urban-fitness.projectsites.dev/'
 */
export const normalizeUrl = (u: string): string => {
  const t = (u || '').trim();
  if (!t) return t;
  return t.replace(/\.\.projectsites\.dev/g, '.projectsites.dev');
};
const DEFAULT_NAME = 'Your Business';
const DEFAULTS = {
  name: DEFAULT_NAME,
  shortName: DEFAULT_NAME.slice(0, 12),
  tagline: '',
  description: '',
  url: '',
  businessClass: 'organization',
  email: '',
  phone: '',
  address: '',
  hours: '',
};

/**
 * A structurally-COMPLETE default brand. Every non-business sub-object
 * (`color`, `font`, `radius`, `spacing`, `shadow`, `motion`, `layout`,
 * `social`, `features`) is populated with the same concrete values the shipped
 * `_brand.json` carries — palette pre-resolved (no unresolved `{...}` refs).
 *
 * Why this exists (root-cause fix, journey 2026-08-20 — site scored 2.8/10,
 * "hero-only, everything below blank"):
 *
 * When a FRESH build copy is missing or only partially materializes
 * `_brand.json`, `resolved` is `{}` (or lacks a sub-object). Spreading that
 * over `business` alone left `brand.color`, `brand.motion`, `brand.radius`,
 * etc. as `undefined`. `applyBrand()` then does `const c = brand.color; c[k]`
 * and throws **`Cannot read properties of undefined (reading 'primary')`** —
 * the exact fatal reported. Critically, `applyBrand()` runs at module load in
 * `main.tsx` BEFORE `ReactDOM.createRoot().render(<ErrorBoundary>…)`, so
 * neither `ErrorBoundary` nor `SafeSection` can catch it: the whole app fails
 * to mount and the page renders hero-only (the pre-rendered SEO shell) with
 * nothing below.
 *
 * Deep-merging `resolved` OVER this skeleton guarantees every sub-object is
 * always present, so `applyBrand()` and every component data-access degrade to
 * a fully-styled default instead of crashing the entire site. Pure data —
 * no LLM compliance involved; template-side self-healing.
 */
const DEFAULT_BRAND: Omit<Brand, 'business'> = {
  color: {
    brandHue: 240,
    brandChroma: 0.18,
    primary: 'oklch(0.62 0.18 240)',
    primaryHover: 'oklch(0.55 0.18 240)',
    accent: 'oklch(0.85 0.18 195)',
    accentHover: 'oklch(0.78 0.18 195)',
    background: 'oklch(0.08 0.02 240)',
    surface: 'oklch(0.13 0.02 240)',
    surfaceElevated: 'oklch(0.17 0.02 240)',
    border: 'oklch(0.28 0.02 240)',
    text: 'oklch(0.97 0.005 240)',
    textMuted: 'oklch(0.75 0.01 240)',
    textSubtle: 'oklch(0.60 0.01 240)',
    success: 'oklch(0.72 0.17 155)',
    warning: 'oklch(0.80 0.16 85)',
    danger: 'oklch(0.63 0.22 25)',
    info: 'oklch(0.70 0.14 240)',
  },
  colorScheme: 'dark',
  themeStyle: DEFAULT_PRESET,
  font: {
    heading: 'Space Grotesk',
    body: 'Inter',
    mono: 'JetBrains Mono',
    weights: [300, 400, 500, 600, 700, 800, 900],
    fluidScale: 'clamp',
  },
  radius: { sm: '0.375rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem', full: '9999px' },
  spacing: {
    '0': '0', '1': '0.25rem', '2': '0.5rem', '3': '0.75rem', '4': '1rem',
    '6': '1.5rem', '8': '2rem', '12': '3rem', '16': '4rem', '24': '6rem', '32': '8rem',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
    md: '0 4px 12px -2px rgb(0 0 0 / 0.35)',
    lg: '0 12px 32px -8px rgb(0 0 0 / 0.45)',
    glow: '0 0 40px -8px oklch(0.85 0.18 195 / 0.35)',
  },
  motion: {
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    duration: { fast: '150ms', base: '250ms', slow: '450ms', scroll: '1200ms' },
  },
  layout: { containerWide: '80rem', containerNormal: '64rem', containerProse: '42rem' },
  social: {},
  features: {},
};

/**
 * Shallow-merge a resolved sub-object over its default, dropping any key whose
 * resolved value is `undefined`/`null` or a still-unresolved `{TOKEN}` leaf so
 * a partial `_brand.json` never punches a hole in an otherwise-complete object.
 */
function mergeGroup<T extends Record<string, unknown>>(base: T, override: unknown): T {
  if (!override || typeof override !== 'object') return base;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && (v.trim() === '' || /\{[^}]+\}/.test(v))) continue;
    out[k] = v;
  }
  return out as T;
}

const r = resolved as Record<string, unknown>;
const businessClassValue = pick('businessClass', DEFAULTS.businessClass);
// themeStyle precedence (template-side self-healing, no LLM-compliance needed):
//   1. an explicit VALID _brand.json themeStyle wins;
//   2. else derive the personality from businessClass (the build reliably sets it);
//   3. else 'classic' (presetForClass's own fallback).
// The chosen preset is then the BASE for font/radius/shadow/motion, and a per-key
// _brand.json value still wins via mergeGroup below (source-extracted fonts survive).
const explicitStyle =
  typeof r.themeStyle === 'string' && PRESET_NAMES.includes(r.themeStyle.trim().toLowerCase() as PresetName)
    ? (r.themeStyle.trim().toLowerCase() as PresetName)
    : null;
const themeStyle: PresetName = explicitStyle ?? presetForClass(businessClassValue);
const preset = resolvePreset(themeStyle);
export const brand: Brand = {
  business: {
    name: pick('name', DEFAULTS.name),
    shortName: pick('shortName', DEFAULTS.shortName),
    tagline: pick('tagline', DEFAULTS.tagline),
    description: pick('description', DEFAULTS.description),
    url: normalizeUrl(pick('url', DEFAULTS.url)),
    businessClass: businessClassValue,
    email: pick('email', DEFAULTS.email),
    phone: pick('phone', DEFAULTS.phone),
    address: pick('address', DEFAULTS.address),
    hours: pick('hours', DEFAULTS.hours),
  },
  color: mergeGroup(DEFAULT_BRAND.color, r.color),
  colorScheme: (typeof r.colorScheme === 'string' ? r.colorScheme : DEFAULT_BRAND.colorScheme) as Brand['colorScheme'],
  themeStyle,
  font: {
    // weights + fluidScale come from DEFAULT_BRAND; the preset supplies the
    // family pairing; an explicit _brand.json font still wins per-key.
    ...mergeGroup({ ...DEFAULT_BRAND.font, ...preset.font } as unknown as Record<string, unknown>, r.font),
    weights:
      Array.isArray((r.font as { weights?: unknown } | undefined)?.weights) &&
      ((r.font as { weights: unknown[] }).weights.length > 0)
        ? (r.font as { weights: number[] }).weights
        : DEFAULT_BRAND.font.weights,
  } as Brand['font'],
  radius: mergeGroup(preset.radius as unknown as Record<string, string>, r.radius),
  spacing: mergeGroup(DEFAULT_BRAND.spacing, r.spacing),
  shadow: mergeGroup(preset.shadow as unknown as Record<string, string>, r.shadow),
  motion: {
    easing:
      typeof (r.motion as { easing?: unknown } | undefined)?.easing === 'string'
        ? (r.motion as { easing: string }).easing
        : preset.motion.easing,
    duration: mergeGroup(
      preset.motion.duration as unknown as Record<string, string>,
      (r.motion as { duration?: unknown } | undefined)?.duration,
    ),
  },
  layout: mergeGroup(DEFAULT_BRAND.layout, r.layout),
  social: mergeGroup(DEFAULT_BRAND.social, r.social),
  features: mergeGroup(DEFAULT_BRAND.features, r.features),
} as unknown as Brand;

const COLOR_KEYS = [
  'primary', 'primaryHover', 'accent', 'accentHover',
  'background', 'surface', 'surfaceElevated', 'border',
  'text', 'textMuted', 'textSubtle',
  'success', 'warning', 'danger', 'info',
] as const;

const FLUID_TYPE = {
  '5xl': 'clamp(2.5rem, 5vw + 1rem, 5rem)',
  '4xl': 'clamp(2rem, 4vw + 0.75rem, 3.75rem)',
  '3xl': 'clamp(1.75rem, 3vw + 0.5rem, 3rem)',
  '2xl': 'clamp(1.5rem, 2vw + 0.5rem, 2.25rem)',
  xl:    'clamp(1.25rem, 1vw + 1rem, 1.5rem)',
} as const;

/**
 * Write brand tokens to `:root` as CSS custom properties.
 *
 * @remarks
 * Runs at module load in `main.tsx` BEFORE React mounts, so it executes
 * OUTSIDE the reach of `ErrorBoundary`/`SafeSection`. A throw here would blank
 * the entire site (nothing mounts). The `brand` object is now structurally
 * complete (see `DEFAULT_BRAND`) so the property writes can't hit `undefined`,
 * but the whole body is additionally wrapped in a guard as a last-resort safety
 * net: even an unforeseen shape degrades to "CSS defaults from `index.css`"
 * rather than a dead page. Every access below is also individually
 * `?.`/`??`-guarded so one bad field can't skip the rest.
 */
export function applyBrand(root: HTMLElement = document.documentElement): void {
  try {
    const c = brand.color ?? {};

    for (const k of COLOR_KEYS) {
      const v = c[k];
      if (typeof v === 'string') root.style.setProperty(`--color-${kebab(k)}`, v);
    }

    // On-accent ink: dark text on a LIGHT accent, white on a DARK accent.
    // Keeps `text-[var(--color-on-accent)]` legible whatever the vertical's
    // accent lightness is. Falls back to dark ink (accents ship light).
    const accent = typeof c.accent === 'string' ? c.accent : '';
    root.style.setProperty('--color-on-accent', onAccentInk(accent));
    // Same legible-ink picker for text ON --color-primary (the `primary` button
    // variant): a light brand primary needs dark ink, a dark one white.
    const primary = typeof c.primary === 'string' ? c.primary : '';
    root.style.setProperty('--color-on-primary', onAccentInk(primary));

    root.style.setProperty('--brand-hue', String(c.brandHue ?? 240));
    root.style.setProperty('--brand-chroma', String(c.brandChroma ?? 0.18));

    const font = brand.font ?? DEFAULT_BRAND.font;
    root.style.setProperty('--font-heading', `'${font.heading}', system-ui, sans-serif`);
    root.style.setProperty('--font-body',    `'${font.body}', system-ui, sans-serif`);
    root.style.setProperty('--font-mono',    `'${font.mono}', ui-monospace, monospace`);
    // Setting --font-heading is HALF the job — a CSS variable does not LOAD a
    // font. The static <head> only ships the platform defaults (Inter / Space
    // Grotesk / JetBrains Mono), so any theme whose display font differs (Oswald,
    // Playfair Display, Cormorant Garamond, Fraunces, …) rendered its headings in
    // system-ui — the #1 reason themed sites looked generic (ground-truth probe
    // 2026-09-07: 4/4 sampled sites had their chosen heading font UNLOADED). Load
    // the active families here so the theme's typography actually shows.
    injectThemeFonts(root.ownerDocument ?? document);

    for (const [k, v] of Object.entries(brand.radius ?? {})) root.style.setProperty(`--radius-${k}`, String(v));
    for (const [k, v] of Object.entries(brand.spacing ?? {})) root.style.setProperty(`--space-${k}`, String(v));
    for (const [k, v] of Object.entries(brand.shadow ?? {}))  root.style.setProperty(`--shadow-${k}`, String(v));
    for (const [k, v] of Object.entries(FLUID_TYPE))          root.style.setProperty(`--text-${k}`, v);

    const motion = brand.motion ?? DEFAULT_BRAND.motion;
    root.style.setProperty('--ease',          motion.easing);
    root.style.setProperty('--duration-fast', motion.duration.fast);
    root.style.setProperty('--duration-base', motion.duration.base);
    root.style.setProperty('--duration-slow', motion.duration.slow);

    const layout = brand.layout ?? DEFAULT_BRAND.layout;
    root.style.setProperty('--container-wide',   layout.containerWide);
    root.style.setProperty('--container-normal', layout.containerNormal);
    root.style.setProperty('--container-prose',  layout.containerProse);

    const scheme = brand.colorScheme ?? DEFAULT_BRAND.colorScheme;
    root.style.colorScheme = scheme === 'auto' ? 'light dark' : scheme;
    root.dataset.theme = scheme;
    // Style personality → :root[data-style="…"] flourish hooks in index.css.
    root.dataset.style = brand.themeStyle ?? DEFAULT_PRESET;
  } catch (err) {
    // Last resort: never let a token write crash module init (pre-React,
    // uncatchable by ErrorBoundary). The site falls back to the static CSS
    // defaults shipped in index.css. Logged in dev only.
    if (import.meta.env.DEV) console.error('[applyBrand] skipped — using CSS defaults:', err);
  }
}

function kebab(s: string): string {
  return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Pick a legible ink color to render ON TOP OF an accent swatch.
 *
 * OKLCH's first component IS perceptual lightness (0–1), so a light accent
 * (L ≳ 0.62) gets dark ink and a dark accent gets near-white — matching WCAG
 * contrast intent without a full contrast solve. Non-OKLCH inputs (hex/rgb) use
 * a quick relative-luminance estimate. Empty/unparseable → dark ink (accents
 * ship light across the presets).
 *
 * @example onAccentInk('oklch(0.86 0.13 190)') // → 'oklch(0.18 0.02 190)' (dark)
 * @example onAccentInk('oklch(0.34 0.09 245)') // → 'oklch(0.98 0 0)'       (white)
 */
export function onAccentInk(accent: string): string {
  const DARK = 'oklch(0.16 0.02 var(--brand-hue))';
  const LIGHT = 'oklch(0.98 0 0)';
  const a = (accent || '').trim();
  if (!a) return DARK;

  const oklch = a.match(/oklch\(\s*([0-9]*\.?[0-9]+)/i);
  if (oklch) {
    const L = Number(oklch[1]);
    return Number.isFinite(L) && L >= 0.62 ? DARK : LIGHT;
  }

  const hex = a.match(/^#?([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum >= 0.55 ? DARK : LIGHT;
  }

  const rgb = a.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) {
    const [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum >= 0.55 ? DARK : LIGHT;
  }

  return DARK;
}

export function featureOn(key: keyof Brand['features']): boolean {
  return Boolean(brand.features[key]);
}

export function googleFontsHref(): string {
  const fams = [brand.font.heading, brand.font.body, brand.font.mono]
    .filter(Boolean)
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${brand.font.weights.join(';')}`);
  return `https://fonts.googleapis.com/css2?${fams.join('&')}&display=swap`;
}

/** The id of the runtime-injected theme-fonts stylesheet (idempotent handle). */
export const THEME_FONTS_LINK_ID = 'ps-theme-fonts';

/**
 * Ensure the ACTIVE brand fonts are actually loaded by injecting (or updating) a
 * Google Fonts `<link rel="stylesheet">` built from {@link googleFontsHref}.
 *
 * @remarks
 * {@link applyBrand} sets `--font-heading` / `--font-body` from the resolved theme
 * preset (e.g. `'Oswald'`, `'Playfair Display'`), but a CSS custom property does
 * NOT load a font. The static `<head>` only ships the platform defaults (Inter /
 * Space Grotesk / JetBrains Mono), so any theme whose fonts differ rendered its
 * headings in `system-ui` — the #1 reason themed sites looked generic
 * (ground-truth probe 2026-09-07: aurelia→Oswald, emberline→Playfair Display,
 * camden→Cormorant Garamond, vanta→Inter Tight — all UNLOADED web fonts). Loading
 * the active families deterministically here means the theme's typography no
 * longer depends on the build remembering to hand-edit `<head>`.
 *
 * Idempotent: reuses the `#ps-theme-fonts` element and only rewrites `href` when it
 * changes (avoids a redundant stylesheet re-request). Never throws — fonts are an
 * enhancement and this runs pre-React, outside any `ErrorBoundary`.
 *
 * @param doc - target document (defaults to the global `document`); parameterized for tests.
 * @example
 * injectThemeFonts();
 * // → <link id="ps-theme-fonts" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@…">
 */
export function injectThemeFonts(doc: Document = document): void {
  try {
    if (!doc || typeof doc.createElement !== 'function') return;
    const href = googleFontsHref();
    let link = doc.getElementById(THEME_FONTS_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = doc.createElement('link');
      link.id = THEME_FONTS_LINK_ID;
      link.rel = 'stylesheet';
      (doc.head ?? doc.documentElement)?.appendChild(link);
    }
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  } catch {
    /* fonts are an enhancement — never crash brand init (runs pre-React, uncatchable by ErrorBoundary) */
  }
}
