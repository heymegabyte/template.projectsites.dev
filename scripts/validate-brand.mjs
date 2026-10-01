#!/usr/bin/env node
/**
 * Validate `_brand.json` against the Zod schema in `src/brandSchema.ts`.
 *
 *   npm run validate:brand                # validates root _brand.json
 *   node scripts/validate-brand.mjs path  # validates an arbitrary file
 *
 * Exit codes:
 *   0  — schema valid (warnings still surface but don't fail)
 *   1  — schema invalid
 *   2  — file not found / unreadable
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const inputPath = process.argv[2] ?? resolve(repoRoot, '_brand.json');

if (!existsSync(inputPath)) {
  console.error(`✗ File not found: ${inputPath}`);
  process.exit(2);
}

let raw;
try {
  raw = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (err) {
  console.error(`✗ Invalid JSON in ${inputPath}: ${err.message}`);
  process.exit(2);
}

// Re-implement schema inline. We can't `import` the TS schema from a .mjs
// without a build step — and we want this script to run with zero setup.
// Keep the schema shape minimal here; the canonical source is `src/brandSchema.ts`.
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
  'storefront','restaurant','medical','retail','salon','gym','auto-repair',
  'saas','portfolio','nonprofit','legal','organization',
]);
const colorSchemeEnum = z.enum(['dark','light','auto']);

// OPT-IN industry WebGL hero engine block (see src/components/webgl/ +
// docs/webgl-industry-hero.md). Mirrors `webgl` in src/brandSchema.ts: both
// plain values and DTCG `$value` tokens are accepted; all fields optional.
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be #rrggbb');
const plainOrToken = (value) => z.union([
  value,
  z.object({ $value: value, $type: z.string().optional(), $description: z.string().optional() }),
]);
const webglGroup = z.object({
  $description: z.string().optional(),
  variant:    plainOrToken(z.enum(['ember','rays','glint','grid'])).optional(),
  background: plainOrToken(hexColor).optional(),
  palette:    plainOrToken(z.array(hexColor)).optional(),
  speed:      plainOrToken(z.number()).optional(),
  intensity:  plainOrToken(z.number()).optional(),
  density:    plainOrToken(z.number()).optional(),
  grain:      plainOrToken(z.number()).optional(),
});

const brandSchema = z.object({
  $schema: z.string().optional(),
  $description: z.string().optional(),
  business: z.object({
    name: tokenString, shortName: tokenString, tagline: tokenString,
    description: tokenString, url: tokenString,
    businessClass: z.object({
      $value: z.union([businessClassEnum, z.string()]),
      $type: z.string().optional(), $description: z.string().optional(),
    }),
    email: tokenString, phone: tokenString, address: tokenString, hours: tokenString,
  }),
  color: z.object({
    brandHue: tokenNumber, brandChroma: tokenNumber,
    primary: tokenString, primaryHover: tokenString,
    accent: tokenString, accentHover: tokenString,
    background: tokenString, surface: tokenString, surfaceElevated: tokenString,
    border: tokenString, text: tokenString, textMuted: tokenString, textSubtle: tokenString,
    success: tokenString, warning: tokenString, danger: tokenString, info: tokenString,
  }).catchall(tokenString),
  colorScheme: z.object({
    $value: z.union([colorSchemeEnum, z.string()]),
    $type: z.string().optional(), $description: z.string().optional(),
  }),
  // Visual personality preset (optional; absent → 'classic'). See src/themePresets.ts.
  themeStyle: tokenString.optional(),
  font: z.object({
    heading: tokenString, body: tokenString, mono: tokenString,
    weights: tokenNumberArray, fluidScale: tokenString,
  }),
  radius:  z.object({ $description: z.string().optional() }).catchall(tokenString),
  spacing: z.object({ $description: z.string().optional() }).catchall(tokenString),
  shadow:  z.object({ $description: z.string().optional() }).catchall(tokenString),
  motion:  z.object({
    easing: tokenString,
    duration: z.object({ fast: tokenString, base: tokenString, slow: tokenString, scroll: tokenString }),
  }),
  layout:  z.object({ containerWide: tokenString, containerNormal: tokenString, containerProse: tokenString }),
  social:  z.object({ $description: z.string().optional() }).catchall(tokenString),
  features:z.object({ $description: z.string().optional() }).catchall(tokenBool),
  // Optional opt-in; absence keeps the auto themeStyle-derived hero backdrop.
  webgl:   webglGroup.optional(),
}).strict();

const result = brandSchema.safeParse(raw);

if (!result.success) {
  console.error(`✗ Schema validation failed for ${inputPath}`);
  for (const issue of result.error.issues) {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const brand = result.data;
console.log(`✓ ${inputPath} — schema valid`);

// Soft warnings — re-implement inline (same as `lintBrand` in src/brandSchema.ts).
const warnings = [];

for (const [k, v] of Object.entries(brand.business)) {
  if (typeof v.$value === 'string' && /^\{[A-Z_0-9]+\}$/.test(v.$value)) {
    warnings.push({ key: `business.${k}`, message: `placeholder "${v.$value}" not substituted`, severity: 'warn' });
  }
}
const hue = Number(brand.color.brandHue.$value);
if (Number.isFinite(hue) && (hue < 0 || hue > 360)) {
  warnings.push({ key: 'color.brandHue', message: `${hue} is outside 0-360`, severity: 'warn' });
}
const chroma = Number(brand.color.brandChroma.$value);
if (Number.isFinite(chroma) && (chroma < 0 || chroma > 0.4)) {
  warnings.push({ key: 'color.brandChroma', message: `${chroma} is outside 0-0.4`, severity: 'warn' });
}
const desc = brand.business.description.$value;
if (typeof desc === 'string' && !desc.startsWith('{') && (desc.length < 50 || desc.length > 200)) {
  warnings.push({ key: 'business.description', message: `length ${desc.length}; recommend 120-156 chars`, severity: 'info' });
}
const url = brand.business.url.$value;
if (typeof url === 'string' && !url.startsWith('{') && !/^https:\/\/[^/]+(\/.*)?$/.test(url)) {
  warnings.push({ key: 'business.url', message: `should be https://… without trailing slash`, severity: 'warn' });
}
const phone = brand.business.phone.$value;
if (typeof phone === 'string' && phone !== '' && !phone.startsWith('{') && !/^\+\d{8,15}$/.test(phone)) {
  warnings.push({ key: 'business.phone', message: `should be E.164 (e.g. +12025550100)`, severity: 'warn' });
}

if (warnings.length === 0) {
  console.log('✓ no warnings — brand ready to ship');
  process.exit(0);
}

const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const blue   = (s) => `\x1b[36m${s}\x1b[0m`;

console.log(`\n${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`);
for (const w of warnings) {
  const icon = w.severity === 'warn' ? yellow('⚠') : blue('ℹ');
  console.log(`  ${icon} ${w.key}: ${w.message}`);
}
console.log('\nSchema is valid — warnings are advisory.');
process.exit(0);
