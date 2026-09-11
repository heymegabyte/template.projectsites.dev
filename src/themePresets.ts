/**
 * Theme style presets — cohesive visual PERSONALITIES for generated sites.
 *
 * The token system in `_brand.json` varies COLOR per business (OKLCH hue/chroma),
 * but every site otherwise shared ONE look: the same font pairing, radius scale,
 * shadow character, and motion curve. That made generated sites feel same-y no
 * matter the vertical.
 *
 * A `themeStyle` picks one of the personalities below. `src/brand.ts` uses the
 * chosen preset as the BASE for `font`/`radius`/`shadow`/`motion` (a per-key
 * `_brand.json` value still wins, so source-extracted fonts are never clobbered),
 * and `applyBrand()` stamps `:root[data-style="<preset>"]` so `index.css` can add
 * a matching decorative flourish. `classic` reproduces the historical default
 * verbatim, so a build that omits `themeStyle` looks EXACTLY as before.
 *
 * Pure data + one pure resolver. Never throws — an unknown name degrades to
 * `classic` so a bad LLM value can never break a build.
 */

/** A cohesive font pairing. All families are Google Fonts with wide weight ranges. */
export interface PresetFont {
  readonly heading: string;
  readonly body: string;
  readonly mono: string;
}

/** Border-radius scale (rem strings + `full`). */
export interface PresetRadius {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly xl: string;
  readonly '2xl': string;
  readonly full: string;
}

/** Elevation shadows + the accent `glow`. */
export interface PresetShadow {
  readonly sm: string;
  readonly md: string;
  readonly lg: string;
  readonly glow: string;
}

/** Motion easing + the four named durations. */
export interface PresetMotion {
  readonly easing: string;
  readonly duration: { readonly fast: string; readonly base: string; readonly slow: string; readonly scroll: string };
}

/** One complete visual personality. */
export interface ThemePreset {
  /** Human label for the admin / research prompt. */
  readonly label: string;
  /** One-line "when to use" for the generation prompt. */
  readonly when: string;
  readonly font: PresetFont;
  readonly radius: PresetRadius;
  readonly shadow: PresetShadow;
  readonly motion: PresetMotion;
}

const MONO = 'JetBrains Mono';

/**
 * The preset registry. `classic` MUST stay byte-identical to the historical
 * `DEFAULT_BRAND` in `brand.ts` so an unset `themeStyle` is a no-op.
 */
export const THEME_PRESETS = {
  /** Modern, techy, geometric — the historical default. saas · tech · portfolio · auto. */
  classic: {
    label: 'Classic',
    when: 'retail, general modern brands, mixed-vertical fallback — geometric + confident',
    font: { heading: 'Space Grotesk', body: 'Inter', mono: MONO },
    radius: { sm: '0.375rem', md: '0.75rem', lg: '1rem', xl: '1.5rem', '2xl': '2rem', full: '9999px' },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
      md: '0 4px 12px -2px rgb(0 0 0 / 0.35)',
      lg: '0 12px 32px -8px rgb(0 0 0 / 0.45)',
      glow: '0 0 40px -8px oklch(0.85 0.18 195 / 0.35)',
    },
    motion: { easing: 'cubic-bezier(0.16, 1, 0.3, 1)', duration: { fast: '150ms', base: '250ms', slow: '450ms', scroll: '1200ms' } },
  },

  /** Serif headlines, generous rhythm, restrained shadows — trustworthy + literary. legal · medical · nonprofit · organization. */
  editorial: {
    label: 'Editorial',
    when: 'legal, medical, nonprofit, organization, consulting — trustworthy, calm, magazine-grade',
    font: { heading: 'Fraunces', body: 'Inter', mono: MONO },
    radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.25rem', full: '9999px' },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.18)',
      md: '0 6px 18px -6px rgb(0 0 0 / 0.28)',
      lg: '0 18px 44px -14px rgb(0 0 0 / 0.38)',
      glow: '0 0 32px -10px oklch(0.85 0.14 var(--brand-hue) / 0.28)',
    },
    motion: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: { fast: '180ms', base: '320ms', slow: '560ms', scroll: '1400ms' } },
  },

  /** Rounded humanist type, big radii, soft diffuse light — inviting + friendly. restaurant · salon · gym · wellness · community. */
  warm: {
    label: 'Warm',
    when: 'restaurant, salon, gym, wellness, community, kids/family — inviting, soft, approachable',
    font: { heading: 'Poppins', body: 'Nunito Sans', mono: MONO },
    radius: { sm: '0.625rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '2.5rem', full: '9999px' },
    shadow: {
      sm: '0 2px 6px -1px rgb(0 0 0 / 0.18)',
      md: '0 8px 24px -6px rgb(0 0 0 / 0.28)',
      lg: '0 20px 52px -14px rgb(0 0 0 / 0.36)',
      glow: '0 0 56px -10px oklch(0.85 0.16 var(--brand-hue) / 0.40)',
    },
    motion: { easing: 'cubic-bezier(0.34, 1.4, 0.5, 1)', duration: { fast: '160ms', base: '280ms', slow: '500ms', scroll: '1300ms' } },
  },

  /** High-contrast serif display, tight radii, deep low shadows — refined + premium. fine dining · high-end retail · real-estate · hospitality. */
  luxe: {
    label: 'Luxe',
    when: 'fine dining, high-end retail, real-estate, hospitality, jewelry — refined, premium, editorial-elegant',
    font: { heading: 'Playfair Display', body: 'Inter', mono: MONO },
    radius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', '2xl': '0.75rem', full: '9999px' },
    shadow: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.30)',
      md: '0 10px 30px -10px rgb(0 0 0 / 0.45)',
      lg: '0 28px 64px -20px rgb(0 0 0 / 0.55)',
      glow: '0 0 48px -12px oklch(0.86 0.10 var(--brand-hue) / 0.30)',
    },
    motion: { easing: 'cubic-bezier(0.16, 1, 0.3, 1)', duration: { fast: '200ms', base: '400ms', slow: '700ms', scroll: '1600ms' } },
  },

  /** Heavy grotesk, near-zero radius, hard offset shadows, snappy motion — bold + confident. creative agency · portfolio · events · streetwear. */
  brutalist: {
    label: 'Brutalist',
    when: 'creative agency, portfolio, events, streetwear, bold modern brands — high-impact, editorial-bold',
    font: { heading: 'Archivo', body: 'Inter', mono: MONO },
    radius: { sm: '0', md: '0', lg: '0.125rem', xl: '0.25rem', '2xl': '0.25rem', full: '9999px' },
    shadow: {
      sm: '2px 2px 0 0 rgb(0 0 0 / 0.55)',
      md: '5px 5px 0 0 rgb(0 0 0 / 0.55)',
      lg: '9px 9px 0 0 rgb(0 0 0 / 0.55)',
      glow: '0 0 0 2px oklch(0.85 0.18 195 / 0.55)',
    },
    motion: { easing: 'cubic-bezier(0.4, 0, 0.2, 1)', duration: { fast: '110ms', base: '190ms', slow: '300ms', scroll: '900ms' } },
  },

  /** Athletic condensed display, punchy radii, strong brand glow, snappy motion — high-energy. fitness · gym · events · sports. */
  bold: {
    label: 'Bold',
    when: 'fitness, gym, events, sports, martial arts, high-energy brands — athletic, loud, kinetic',
    font: { heading: 'Oswald', body: 'Inter', mono: MONO },
    radius: { sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.25rem', full: '9999px' },
    shadow: {
      sm: '0 2px 4px 0 rgb(0 0 0 / 0.30)',
      md: '0 6px 16px -3px rgb(0 0 0 / 0.40)',
      lg: '0 16px 40px -10px rgb(0 0 0 / 0.50)',
      glow: '0 0 44px -6px oklch(0.75 0.20 var(--brand-hue) / 0.50)',
    },
    motion: { easing: 'cubic-bezier(0.2, 0.9, 0.25, 1)', duration: { fast: '120ms', base: '200ms', slow: '340ms', scroll: '1000ms' } },
  },

  /** Geometric sans, generous glassy radii, neon accent glow, floaty motion — sleek + modern. tech · saas · digital products. */
  futuristic: {
    label: 'Futuristic',
    when: 'tech, saas, ai, fintech, digital products, developer tools — sleek, glassy, gradient-forward',
    font: { heading: 'Sora', body: 'Inter', mono: MONO },
    radius: { sm: '0.5rem', md: '0.875rem', lg: '1.25rem', xl: '1.75rem', '2xl': '2.25rem', full: '9999px' },
    shadow: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.30)',
      md: '0 8px 28px -8px rgb(0 0 0 / 0.45)',
      lg: '0 24px 60px -16px rgb(0 0 0 / 0.55)',
      glow: '0 0 52px -6px oklch(0.80 0.19 var(--brand-hue) / 0.48)',
    },
    motion: { easing: 'cubic-bezier(0.33, 1, 0.68, 1)', duration: { fast: '160ms', base: '300ms', slow: '520ms', scroll: '1400ms' } },
  },

  /** Slab serif, squared radii, deep grounded shadows, deliberate motion — industrial + dependable. construction · auto · trades. */
  rugged: {
    label: 'Rugged',
    when: 'construction, auto-repair, trades, home services, manufacturing, logistics — sturdy, industrial, dependable',
    font: { heading: 'Roboto Slab', body: 'Inter', mono: MONO },
    radius: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.625rem', '2xl': '0.75rem', full: '9999px' },
    shadow: {
      sm: '0 2px 4px 0 rgb(0 0 0 / 0.35)',
      md: '0 8px 20px -4px rgb(0 0 0 / 0.45)',
      lg: '0 18px 44px -12px rgb(0 0 0 / 0.55)',
      glow: '0 0 28px -10px oklch(0.72 0.12 var(--brand-hue) / 0.30)',
    },
    motion: { easing: 'cubic-bezier(0.4, 0, 0.2, 1)', duration: { fast: '140ms', base: '240ms', slow: '420ms', scroll: '1100ms' } },
  },

  /** Rounded humanist type, big soft radii, feather-light shadows, calm motion — fresh + reassuring. medical · wellness · spa · dental · clinics. */
  botanical: {
    label: 'Botanical',
    when: 'medical, wellness, spa, dental, therapy, clinics — calming, fresh, organic, reassuring',
    font: { heading: 'Poppins', body: 'Open Sans', mono: MONO },
    radius: { sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '2.5rem', full: '9999px' },
    shadow: {
      sm: '0 2px 8px -2px rgb(0 0 0 / 0.12)',
      md: '0 8px 28px -8px rgb(0 0 0 / 0.20)',
      lg: '0 22px 56px -18px rgb(0 0 0 / 0.28)',
      glow: '0 0 48px -12px oklch(0.85 0.14 var(--brand-hue) / 0.32)',
    },
    motion: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: { fast: '200ms', base: '400ms', slow: '620ms', scroll: '1500ms' } },
  },

  /** High-contrast display serif + geometric body, elegant medium radii, soft lifted shadows — chic + tactile. boutique retail · fashion · beauty · lifestyle. */
  boutique: {
    label: 'Boutique',
    when: 'boutique retail, fashion, beauty, lifestyle, home goods — chic, tactile, editorial-shoppable',
    font: { heading: 'Fraunces', body: 'Jost', mono: MONO },
    radius: { sm: '0.375rem', md: '0.75rem', lg: '1rem', xl: '1.25rem', '2xl': '1.5rem', full: '9999px' },
    shadow: {
      sm: '0 2px 6px -1px rgb(0 0 0 / 0.16)',
      md: '0 10px 28px -8px rgb(0 0 0 / 0.26)',
      lg: '0 24px 56px -16px rgb(0 0 0 / 0.34)',
      glow: '0 0 44px -10px oklch(0.84 0.13 var(--brand-hue) / 0.34)',
    },
    motion: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: { fast: '170ms', base: '340ms', slow: '560ms', scroll: '1400ms' } },
  },

  /** Technical condensed display, razor radii, crisp reflective shadows, fast precise motion — engineered + metallic. automotive · performance · industrial-sleek. */
  precision: {
    label: 'Precision',
    when: 'automotive, dealerships, performance, machinery, hardware, industrial-sleek — engineered, sharp, metallic',
    font: { heading: 'Rajdhani', body: 'Inter', mono: MONO },
    radius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', '2xl': '0.625rem', full: '9999px' },
    shadow: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.32)',
      md: '0 6px 18px -4px rgb(0 0 0 / 0.44)',
      lg: '0 18px 46px -12px rgb(0 0 0 / 0.54)',
      glow: '0 0 40px -6px oklch(0.80 0.17 var(--brand-hue) / 0.44)',
    },
    motion: { easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)', duration: { fast: '130ms', base: '250ms', slow: '400ms', scroll: '1100ms' } },
  },

  /** Classic transitional serif, small engraved radii, subtle print elevation, dignified motion — timeless + trusted. financial · insurance · advisory · established professional. */
  heritage: {
    label: 'Heritage',
    when: 'financial, accounting, insurance, advisory, wealth, established professional — timeless, authoritative, trusted',
    font: { heading: 'Libre Baskerville', body: 'Source Sans 3', mono: MONO },
    radius: { sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem', '2xl': '0.625rem', full: '9999px' },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.20)',
      md: '0 6px 16px -6px rgb(0 0 0 / 0.28)',
      lg: '0 16px 40px -14px rgb(0 0 0 / 0.36)',
      glow: '0 0 30px -12px oklch(0.86 0.09 var(--brand-hue) / 0.26)',
    },
    motion: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: { fast: '200ms', base: '380ms', slow: '640ms', scroll: '1500ms' } },
  },

  /** Rounded friendly display, big playful radii, soft lifted shadows, springy motion — bright + encouraging. education · tutoring · kids · courses. */
  scholarly: {
    label: 'Scholarly',
    when: 'education, tutoring, schools, kids, courses, coaching — bright, friendly, approachable, encouraging',
    font: { heading: 'Quicksand', body: 'Nunito Sans', mono: MONO },
    radius: { sm: '0.625rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '2.5rem', full: '9999px' },
    shadow: {
      sm: '0 2px 6px -1px rgb(0 0 0 / 0.16)',
      md: '0 8px 22px -6px rgb(0 0 0 / 0.26)',
      lg: '0 20px 50px -14px rgb(0 0 0 / 0.34)',
      glow: '0 0 52px -10px oklch(0.82 0.16 var(--brand-hue) / 0.42)',
    },
    motion: { easing: 'cubic-bezier(0.34, 1.4, 0.5, 1)', duration: { fast: '150ms', base: '300ms', slow: '480ms', scroll: '1200ms' } },
  },

  /** Cinematic display serif, razor radii, deep vignette + warm glow, slow theatrical motion — intimate + after-dark. steakhouse · cocktail bar · lounge · nightlife · tattoo · dark-luxe hospitality. */
  noir: {
    label: 'Noir',
    when: 'steakhouse, cocktail bar, lounge, nightlife, speakeasy, tattoo, dark-luxe hospitality — cinematic, intimate, after-dark',
    font: { heading: 'Cinzel', body: 'Manrope', mono: MONO },
    radius: { sm: '0.125rem', md: '0.1875rem', lg: '0.25rem', xl: '0.375rem', '2xl': '0.5rem', full: '9999px' },
    shadow: {
      sm: '0 2px 8px -2px rgb(0 0 0 / 0.60)',
      md: '0 14px 40px -14px rgb(0 0 0 / 0.70)',
      lg: '0 34px 80px -28px rgb(0 0 0 / 0.80)',
      glow: '0 0 60px -14px oklch(0.82 0.12 var(--brand-hue) / 0.40)',
    },
    motion: { easing: 'cubic-bezier(0.16, 1, 0.3, 1)', duration: { fast: '220ms', base: '440ms', slow: '760ms', scroll: '1700ms' } },
  },

  /** Chunky grotesque display, rounded radii, hard offset color shadows, bouncy spring motion — playful + joyfully vintage. diner · barbershop · record store · arcade · ice-cream · nostalgia brands. */
  retro: {
    label: 'Retro',
    when: 'diner, barbershop, record store, arcade, ice-cream, vintage/nostalgia brands — playful, nostalgic, joyfully vintage',
    font: { heading: 'Bricolage Grotesque', body: 'DM Sans', mono: MONO },
    radius: { sm: '0.5rem', md: '0.875rem', lg: '1.125rem', xl: '1.5rem', '2xl': '2rem', full: '9999px' },
    shadow: {
      sm: '3px 3px 0 0 oklch(0.55 0.15 var(--brand-hue) / 0.45)',
      md: '5px 5px 0 0 oklch(0.55 0.15 var(--brand-hue) / 0.45)',
      lg: '8px 8px 0 0 oklch(0.55 0.15 var(--brand-hue) / 0.45)',
      glow: '0 0 48px -8px oklch(0.78 0.18 var(--brand-hue) / 0.45)',
    },
    motion: { easing: 'cubic-bezier(0.34, 1.56, 0.5, 1)', duration: { fast: '140ms', base: '300ms', slow: '460ms', scroll: '1100ms' } },
  },

  /** Warm literary serif + humanist body, soft radii, quiet paper-shadow layering, gentle motion — handmade + earthy. bakery · coffee roaster · brewery · ceramics · woodwork · craft makers. */
  artisan: {
    label: 'Artisan',
    when: 'bakery, coffee roaster, brewery, ceramics, woodwork, handmade/craft/small-batch makers — handmade, earthy, honest',
    font: { heading: 'Spectral', body: 'Karla', mono: MONO },
    radius: { sm: '0.375rem', md: '0.875rem', lg: '1.125rem', xl: '1.375rem', '2xl': '1.75rem', full: '9999px' },
    shadow: {
      sm: '0 2px 6px -2px rgb(0 0 0 / 0.16)',
      md: '0 10px 28px -10px rgb(0 0 0 / 0.24)',
      lg: '0 24px 56px -20px rgb(0 0 0 / 0.30)',
      glow: '0 0 40px -12px oklch(0.80 0.10 var(--brand-hue) / 0.28)',
    },
    motion: { easing: 'cubic-bezier(0.22, 1, 0.36, 1)', duration: { fast: '180ms', base: '450ms', slow: '640ms', scroll: '1500ms' } },
  },
} as const satisfies Record<string, ThemePreset>;

/** Union of valid preset names. */
export type PresetName = keyof typeof THEME_PRESETS;

/** All preset names, for validation + prompt enumeration. */
export const PRESET_NAMES = Object.keys(THEME_PRESETS) as PresetName[];

/** The safe fallback personality. */
export const DEFAULT_PRESET: PresetName = 'classic';

/**
 * Resolve a (possibly untrusted) style name to a preset. Never throws.
 *
 * @param name - A candidate style name from `_brand.json.themeStyle` (any type).
 * @returns The matching {@link ThemePreset}, or the `classic` preset for any
 *   unknown / empty / non-string input.
 *
 * @example
 * resolvePreset('warm').font.heading   // → 'Poppins'
 * resolvePreset('nope').label          // → 'Classic'
 * resolvePreset(undefined).label       // → 'Classic'
 */
export function resolvePreset(name: unknown): ThemePreset {
  if (typeof name === 'string') {
    const key = name.trim().toLowerCase();
    if (key in THEME_PRESETS) return THEME_PRESETS[key as PresetName];
  }
  return THEME_PRESETS[DEFAULT_PRESET];
}

/**
 * Normalize a candidate style name to a valid {@link PresetName}.
 *
 * @param name - A candidate style name (any type).
 * @returns The matching preset name, or `classic` for anything invalid.
 *
 * @example
 * normalizePresetName('LUXE')  // → 'luxe'
 * normalizePresetName('')      // → 'classic'
 */
export function normalizePresetName(name: unknown): PresetName {
  if (typeof name === 'string') {
    const key = name.trim().toLowerCase();
    if (key in THEME_PRESETS) return key as PresetName;
  }
  return DEFAULT_PRESET;
}

/**
 * Default personality per `business.businessClass` — the self-healing fallback
 * for when `_brand.json` omits `themeStyle` (a build LLM sets businessClass far
 * more reliably than a new themeStyle field). Keys are the `businessClass` enum
 * from brandSchema.ts.
 */
export const CLASS_TO_PRESET: Record<string, PresetName> = {
  legal: 'editorial',
  medical: 'botanical',
  nonprofit: 'editorial',
  restaurant: 'warm',
  salon: 'warm',
  gym: 'bold',
  storefront: 'warm',
  portfolio: 'brutalist',
  retail: 'boutique',
  'auto-repair': 'rugged',
  saas: 'futuristic',
  organization: 'classic',
};

/**
 * Derive a personality from a `businessClass` value. Never throws.
 *
 * @param businessClass - A `business.businessClass` value (any type).
 * @returns The mapped {@link PresetName}, or `classic` when unmapped/invalid.
 *
 * @example
 * presetForClass('legal')   // → 'editorial'
 * presetForClass('salon')   // → 'warm'
 * presetForClass('unknown') // → 'classic'
 */
export function presetForClass(businessClass: unknown): PresetName {
  if (typeof businessClass === 'string') {
    const key = businessClass.trim().toLowerCase();
    if (key in CLASS_TO_PRESET) return CLASS_TO_PRESET[key];
  }
  return DEFAULT_PRESET;
}
