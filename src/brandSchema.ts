import { z } from 'zod';

/**
 * Zod schema for `_brand.json` (W3C DTCG format).
 *
 * Catches malformed brand configs at install / pre-commit time. Run via
 * `npm run validate:brand` (calls `scripts/validate-brand.mjs`).
 *
 * Pattern: every leaf node MUST have `$value`. Optional `$type` + `$description`.
 * Aliases like `oklch(0.6 {color.brandHue})` are validated as strings — the
 * runtime resolver in `src/brand.ts` substitutes them.
 */

const tokenString = z.object({
  $value: z.string(),
  $type: z.string().optional(),
  $description: z.string().optional(),
});

const tokenNumber = z.object({
  $value: z.union([z.number(), z.string()]),
  $type: z.string().optional(),
  $description: z.string().optional(),
});

const tokenBool = z.object({
  $value: z.boolean(),
  $type: z.string().optional(),
  $description: z.string().optional(),
});

const tokenNumberArray = z.object({
  $value: z.array(z.number()),
  $type: z.string().optional(),
  $description: z.string().optional(),
});

const businessClassEnum = z.enum([
  'storefront',
  'restaurant',
  'medical',
  'retail',
  'salon',
  'gym',
  'auto-repair',
  'saas',
  'portfolio',
  'nonprofit',
  'legal',
  'organization',
]);

const colorSchemeEnum = z.enum(['dark', 'light', 'auto']);

/**
 * The business class token allows the placeholder `{BUSINESS_CLASS}` (literal
 * brace-wrapped value), an empty string, OR a real enum value.
 *
 * This is intentionally permissive at schema level so the template repo
 * ships in a "ready-to-customize" state. The CLI / runtime detect
 * placeholders and degrade gracefully.
 */
const businessClassToken = z.object({
  $value: z.union([businessClassEnum, z.string()]),
  $type: z.string().optional(),
  $description: z.string().optional(),
});

const colorSchemeToken = z.object({
  $value: z.union([colorSchemeEnum, z.string()]),
  $type: z.string().optional(),
  $description: z.string().optional(),
});

/** `#rrggbb` hex string — the WebGL hero engine's color format. */
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be #rrggbb');

const webglVariantEnum = z.enum(['ember', 'rays', 'glint', 'grid']);

/**
 * A `webgl` field accepts BOTH the plain JSON value and the DTCG token form
 * (`{"$value": …}`): the runtime resolver (`resolveTree` in `src/brand.ts`)
 * unwraps `$value` leaves and passes plain primitives/arrays through, so both
 * authored shapes reach components identically. Deliberately permissive.
 */
const plainOrToken = <T extends z.ZodTypeAny>(value: T) =>
  z.union([
    value,
    z.object({
      $value: value,
      $type: z.string().optional(),
      $description: z.string().optional(),
    }),
  ]);

export const brandSchema = z
  .object({
    $schema: z.string().optional(),
    $description: z.string().optional(),

    business: z.object({
      name:          tokenString,
      shortName:     tokenString,
      tagline:       tokenString,
      description:   tokenString,
      url:           tokenString,
      businessClass: businessClassToken,
      email:         tokenString,
      phone:         tokenString,
      address:       tokenString,
      hours:         tokenString,
    }),

    color: z
      .object({
        brandHue:        tokenNumber,
        brandChroma:     tokenNumber,
        primary:         tokenString,
        primaryHover:    tokenString,
        accent:          tokenString,
        accentHover:     tokenString,
        background:      tokenString,
        surface:         tokenString,
        surfaceElevated: tokenString,
        border:          tokenString,
        text:            tokenString,
        textMuted:       tokenString,
        textSubtle:      tokenString,
        success:         tokenString,
        warning:         tokenString,
        danger:          tokenString,
        info:            tokenString,
      })
      .catchall(tokenString),

    colorScheme: colorSchemeToken,

    // Visual personality preset. Optional so pre-existing brand files stay valid;
    // absent → 'classic' (the historical default look). See src/themePresets.ts.
    themeStyle: tokenString.optional(),

    font: z.object({
      heading:    tokenString,
      body:       tokenString,
      mono:       tokenString,
      weights:    tokenNumberArray,
      fluidScale: tokenString,
    }),

    radius: z
      .object({
        sm:  tokenString,
        md:  tokenString,
        lg:  tokenString,
        xl:  tokenString,
        '2xl': tokenString,
        full: tokenString,
        $description: z.string().optional(),
      })
      .catchall(tokenString),

    spacing: z
      .object({ $description: z.string().optional() })
      .catchall(tokenString),

    shadow: z
      .object({
        sm:   tokenString,
        md:   tokenString,
        lg:   tokenString,
        glow: tokenString,
        $description: z.string().optional(),
      })
      .catchall(tokenString),

    motion: z.object({
      easing:   tokenString,
      duration: z.object({
        fast:   tokenString,
        base:   tokenString,
        slow:   tokenString,
        scroll: tokenString,
      }),
    }),

    layout: z.object({
      containerWide:   tokenString,
      containerNormal: tokenString,
      containerProse:  tokenString,
    }),

    social: z
      .object({
        facebook:  tokenString,
        instagram: tokenString,
        linkedin:  tokenString,
        twitter:   tokenString,
        youtube:   tokenString,
        tiktok:    tokenString,
        github:    tokenString,
      })
      .catchall(tokenString),

    features: z
      .object({
        hero:         tokenBool,
        bento:        tokenBool,
        stats:        tokenBool,
        services:     tokenBool,
        process:      tokenBool,
        testimonials: tokenBool,
        logoCloud:    tokenBool,
        pricing:      tokenBool,
        faq:          tokenBool,
        blog:         tokenBool,
        team:         tokenBool,
        caseStudies:  tokenBool,
        newsletter:   tokenBool,
        cta:          tokenBool,
        $description: z.string().optional(),
      })
      .catchall(tokenBool),

    // OPT-IN industry WebGL hero engine (src/components/webgl/WebGLHero.tsx).
    // Presence of this block switches the hero backdrop from the auto
    // themeStyle-derived WebGLHeroBackdrop to the industry-preset shader
    // engine; absence = unchanged auto behavior. All fields optional — a bare
    // `{}` is a valid opt-in that resolves the vertical's default preset.
    webgl: z
      .object({
        $description: z.string().optional(),
        variant:    plainOrToken(webglVariantEnum).optional(),
        background: plainOrToken(hexColor).optional(),
        palette:    plainOrToken(z.array(hexColor)).optional(),
        speed:      plainOrToken(z.number()).optional(),
        intensity:  plainOrToken(z.number()).optional(),
        density:    plainOrToken(z.number()).optional(),
        grain:      plainOrToken(z.number()).optional(),
      })
      .optional(),
  })
  .strict();

export type BrandJson = z.infer<typeof brandSchema>;

/**
 * Soft warnings that aren't schema violations but signal incomplete customization.
 * Returns an array of {key, message} suggestions.
 */
export interface BrandWarning {
  key: string;
  message: string;
  severity: 'warn' | 'info';
}

export function lintBrand(b: BrandJson): BrandWarning[] {
  const warnings: BrandWarning[] = [];

  // Unsubstituted placeholders
  for (const [k, v] of Object.entries(b.business)) {
    if (typeof v.$value === 'string' && /^\{[A-Z_0-9]+\}$/.test(v.$value)) {
      warnings.push({
        key: `business.${k}`,
        message: `placeholder "${v.$value}" not substituted`,
        severity: 'warn',
      });
    }
  }

  // Hue range
  const hue = Number(b.color.brandHue.$value);
  if (Number.isFinite(hue) && (hue < 0 || hue > 360)) {
    warnings.push({
      key: 'color.brandHue',
      message: `${hue} is outside 0-360; will produce undefined OKLCH output`,
      severity: 'warn',
    });
  }

  // Chroma range
  const chroma = Number(b.color.brandChroma.$value);
  if (Number.isFinite(chroma) && (chroma < 0 || chroma > 0.4)) {
    warnings.push({
      key: 'color.brandChroma',
      message: `${chroma} is outside 0-0.4; OKLCH chroma above 0.4 is rarely meaningful`,
      severity: 'warn',
    });
  }

  // Meta description length
  const desc = b.business.description.$value;
  if (typeof desc === 'string' && !desc.startsWith('{') && (desc.length < 50 || desc.length > 200)) {
    warnings.push({
      key: 'business.description',
      message: `length ${desc.length}; recommended 120-156 chars for meta description`,
      severity: 'info',
    });
  }

  // Tagline word count
  const tagline = b.business.tagline.$value;
  if (typeof tagline === 'string' && !tagline.startsWith('{')) {
    const words = tagline.trim().split(/\s+/).length;
    if (words < 2 || words > 8) {
      warnings.push({
        key: 'business.tagline',
        message: `${words} words; recommended 3-5 words`,
        severity: 'info',
      });
    }
  }

  // URL format
  const url = b.business.url.$value;
  if (typeof url === 'string' && !url.startsWith('{') && !/^https:\/\/[^/]+(\/.*)?$/.test(url)) {
    warnings.push({
      key: 'business.url',
      message: `"${url}" should be a fully-qualified https URL without trailing slash`,
      severity: 'warn',
    });
  }

  // Phone E.164
  const phone = b.business.phone.$value;
  if (typeof phone === 'string' && phone !== '' && !phone.startsWith('{') && !/^\+\d{8,15}$/.test(phone)) {
    warnings.push({
      key: 'business.phone',
      message: `"${phone}" should be E.164 (e.g. +12025550100)`,
      severity: 'warn',
    });
  }

  return warnings;
}

/**
 * Parse + validate raw JSON. Throws ZodError on schema mismatch.
 * Returns the parsed object plus any soft warnings.
 */
export function validateBrand(raw: unknown): { brand: BrandJson; warnings: BrandWarning[] } {
  const brand = brandSchema.parse(raw);
  const warnings = lintBrand(brand);
  return { brand, warnings };
}
