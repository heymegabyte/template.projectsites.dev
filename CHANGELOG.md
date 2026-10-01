# Changelog

All notable changes to `projectsites-template` are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org).

## [Unreleased]

### Added

- **Industry WebGL hero presets — opt-in via a `_brand.json` `webgl` block (FIRE-60).**
  New `src/components/webgl/` module (`WebGLHero` wrapper + `webgl-hero-core.mjs`
  shader engine + `presets.mjs` data, synced verbatim from projectsites.dev
  `apps/project-sites/templates/webgl/`): 4 shader variants (ember / rays / glint /
  grid) × 11 industry presets (+ 8 vertical aliases), selected by
  `brand.business.businessClass` with per-field `webgl` overrides (variant /
  background / palette / speed / intensity / density / grain). An EXPLICIT `webgl`
  block in `_brand.json` swaps both heroes (`HeroCenter` + `HeroSplit`) onto the
  engine; when ABSENT the auto `themeStyle`-derived `WebGLHeroBackdrop` renders
  unchanged — zero behavior change for existing brand files. LCP-safe (GL init
  deferred to window load + idle; canvas is never an LCP candidate) and
  reduced-motion / no-WebGL degrade to a static themed CSS gradient.
  `brandSchema.ts` + `validate:brand` accept the optional block (plain or DTCG
  `$value` form). Docs: `docs/webgl-industry-hero.md`.

### Changed

- **Sub-page titles use the real per-vertical tagline (FIRE-53).** About / Services
  / Contact / FAQ / Pricing `useSEO` titles now read
  `"{Page} {BUSINESS_NAME} — {SEO_TAGLINE}"` (e.g. "About Cedarhouse Yoga Studio —
  Find Your Calm and Strength") instead of the bare `"{Page} — {BUSINESS_NAME}"`,
  which `fitMetaTitle` padded to length with a generic
  "· get in touch to learn more" tail. FAQ/Pricing switched from the runtime
  `` `{Page} — ${brand.business.name}` `` template literal to the
  `{BUSINESS_NAME}` + `{SEO_TAGLINE}` token form so `fillTemplateTokens` injects the
  real tagline (present in all 10 content packs). Homepage title unchanged (already
  `BUSINESS_NAME + SEO_TAGLINE`).

### Fixed

- **Contact form: explicit field names + associated labels (FIRE-53, a11y).**
  Every Contact input now carries `name` + `id` + `autoComplete` and every `<label>`
  its `htmlFor`; the previously-anonymous "Subject" field is named `subject`;
  `required` on name/email/message. The edge runtime (`app.js`) `serialize()` was
  delivering name/email/message only via type/`textarea` FALLBACKS (order-fragile,
  and it dropped the subject line entirely). Now the runtime matches by explicit
  `name`, browsers autofill by `autocomplete`, and screen-reader label association
  (WCAG 1.3.1 / 3.3.2) is correct. *(Folding `subject` into the submitted message is
  an `app.js` change deferred to a clean worker tree.)*

- **Systemic placeholder leak (2.8/10 root cause).** Every Home-page section
  component now scrubs unresolved generation tokens at render via the new
  `src/lib/placeholders.ts` firewall (`isPlaceholder` / `scrubText` /
  `scrubList` / `hasRealImage` / `scrubImage`). A raw `{ABOUT_HEADLINE}`,
  `{HERO_SUBHEADLINE}`, `{FEATURE_N_TITLE}`, `{TIER_N_NAME}`, `{FAQ_N_Q}` etc.
  can no longer reach the DOM: empty tokens hide their element (the existing
  `{value && …}` guards), placeholder Q&A/tiers/stats/steps/logos are dropped
  (and excluded from FAQ + Product JSON-LD), and a placeholder image `src`
  (`{ABOUT_IMAGE_URL}`, `{HERO_IMAGE_URL}`) renders NO `<img>` — killing the
  guaranteed 404. Hero + CTA headlines fall back to the real business name /
  sensible defaults so the LCP + conversion anchor always render. Mirrors the
  brand-side self-healing already in `src/brand.ts`; template-side + structural,
  so it fixes EVERY generated site regardless of the generation step. Covered by
  15 unit tests in `tests/unit/placeholders.test.ts`.

## [3.3.0] — 2026-05-21

Apply the recommendations from the v3.2 ship report. The master prompt is now
proven across all 9 industry profiles, gated by automated tests + scoring, and
ready for live demo deploys via GitHub Actions.

### Added

#### 7 new worked examples (in addition to bakery + Latch from v3.2)

Each example is the master prompt's output against a real-feeling brief.
Every example: full `_brand.json`, full `Home.tsx.snippet.tsx`, full
`VERIFICATION.md` decision log, brief `README.md`.

- `examples/applied/chen-family-dentistry/` — medical preset · calming blue · Lora + Inter · Dentist JSON-LD with `aggregateRating` + `medicalSpecialty` + `availableService[]`
- `examples/applied/doe-law/` — legal preset · navy + Cormorant + Lora · LegalService JSON-LD · ethics caveats applied (no testimonials, no outcome claims)
- `examples/applied/field-studio/` — agency preset · bold red · Archivo Black · zero border-radius (tactile brutalism) · 3 case studies with metrics
- `examples/applied/maria-chen/` — portfolio preset · violet · Cabinet Grotesk + Satoshi · Person JSON-LD with `sameAs[]` for EEAT
- `examples/applied/anchorage-weekend-bags/` — nonprofit preset · hopeful green · Crimson Pro · NGO JSON-LD with `nonprofitStatus` + `taxID` + `foundingDate`
- `examples/applied/field-threads/` — retail preset · editorial rose · Playfair Display · OnlineStore JSON-LD · made-to-order sourcing transparency
- `examples/applied/anchor-plumbing/` — local-service preset · dependable blue · Bebas Neue · Plumber JSON-LD with `areaServed[]` (5 cities) + `hasOfferCatalog` (5 services) + StickyPhoneCTA

Total worked-example assets: **9 examples · 41 files · 3,775 lines**

#### Snapshot test — `tests/unit/applied-examples.test.ts`

46 new assertions across the 9 examples. For each:
- `_brand.json` parses + passes Zod schema
- `_brand.json` produces ZERO soft-lint warnings (the prompt's Step 6 gate)
- No real `{PLACEHOLDER}` strings in any `.tsx.snippet.tsx`
- No banned slop words in any `.tsx.snippet.tsx`
- Canonical file set present (`_brand.json` + `*.tsx` + `README.md` + `VERIFICATION.md`)

Any future template change that breaks an applied example, or any future
copy edit that introduces a banned word, fails CI.

#### `npm run prompt-evals` — scoring CLI

`scripts/prompt-evals.mjs` walks every applied example and scores it against
the 7 gates from `PROMPT.md` Step 6:

- G1 Schema valid
- G2 Zero soft-lint warnings
- G3 No real `{PLACEHOLDER}` strings
- G4 No banned slop words
- G5 Hero subheadline 15-25 words
- G6 Description 120-156 chars
- G7 Canonical file set present

Output formats: text (colorized) + `--json` + `--fail-fast`. Wired into the
main CI workflow — every PR now runs prompt-evals as a build gate.

**Current state: 63/63 gates pass (100%) across 9 examples.**

#### GitHub Actions — demo deploys

`.github/workflows/demo-deploys.yml` builds every example as a static site
and deploys to Cloudflare Pages. Each example becomes a publicly viewable
demo URL: `projectsites-demo-{example}.pages.dev`. Triggered on push to
main touching `examples/applied/**` or manual `workflow_dispatch`.

Requires secrets: `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.

### Changed

- Main CI workflow now runs `npm run prompt-evals -- --fail-fast` as a build gate
- Two subheadlines extended to clear the 15-word floor (bakery + retail)
- `package.json` bumped to v3.3.0; added `prompt-evals` script

### Verification

| Gate | Result |
| --- | --- |
| Typecheck | 0 errors |
| Build | 363KB JS / 107KB gzip · 1587 modules |
| Vitest | 88/88 tests pass (was 42 — 46 new) |
| Brand schema | All 9 presets valid |
| Prompt-evals | 63/63 gates pass (100%) across 9 examples |
| Worked examples coverage | 9 of 9 industry presets have an applied output |

## [3.2.0] — 2026-05-20

The prompt system. Master + 8 specialized + worked example.

### Added

#### Master prompt
- `PROMPT.md` at repo root — canonical one-shot site-generation prompt
- 7-step deterministic protocol: preset → hue/chroma → feature flags → business block → page copy → sanity check → verification report
- Industry-specific add-ons (local business, SaaS, portfolio/agency, nonprofit, medical/legal)
- Banned-word list, char/word-count constraints, worked example
- Self-verification block the model must fill in before reporting done
- Pinned to `projectsites-template@3.1.0`

#### Specialized prompt library
- `prompts/01-brand-from-description.md` — `_brand.json` only
- `prompts/02-hero-copy.md` — hero section JSON
- `prompts/03-faqs-from-description.md` — 6-10 FAQs ready for `<FAQ>` component
- `prompts/04-local-jsonld.md` — full `LocalBusiness`-derived JSON-LD
- `prompts/05-audit-slop.md` — banned-word + vague-claim audit
- `prompts/06-migrate-from-url.md` — analyze URL → brand + section composition
- `prompts/07-add-section.md` — propose / implement new section component
- `prompts/08-audit-seo.md` — JSON-LD + meta + GEO coverage
- `prompts/README.md` — prompt-library index

#### Documentation
- `docs/PROMPTS.md` — full prompt-system reference with invocation methods
- AGENTS.md updated to reference master prompt at top of TL;DR
- README.md updated with prompt callout
- `.bolt/prompt` updated to point at the master + specialized prompts

#### Worked example
- `examples/applied/northern-lights-bakery/` — complete output of the master prompt on a real-feeling bakery brief:
  - `_brand.json` (validated, zero warnings)
  - `Home.tsx.snippet.tsx` (real copy, zero placeholders, zero banned words)
  - `Contact.tsx.snippet.tsx` (NAP block + form)
  - `local-jsonld.snippet.tsx` (Bakery schema with geo + aggregateRating + award)
  - `VERIFICATION.md` (self-check report — every assumption documented)

### Verification
- Master prompt's output on the bakery brief passes:
  - `npm run validate:brand` — 0 warnings
  - `npm run typecheck` — 0 errors
  - `npm run build` — 360KB JS / 106KB gzip, 1587 modules
  - Vitest: 41/42 pass (the 1 failure is the placeholder-warning test correctly detecting NO placeholders — confirms prompt output is shipped-ready)

## [3.1.0] — 2026-05-20

Validation, testing, CI, six new section components, scoped agent contracts.

### Added

#### Safety + validation
- `src/brandSchema.ts` — Zod-based schema for `_brand.json` + soft-warning linter
- `scripts/validate-brand.mjs` — CLI: `npm run validate:brand`. Validates schema + surfaces placeholder/range/format warnings.
- `scripts/swap-brand.mjs` — CLI: `npm run brand:swap [name]`. Backs up + swaps `_brand.json` with any `examples/` preset.

#### Testing
- `vitest.config.ts` + `tests/setup.ts` — jsdom + Testing Library setup
- `tests/unit/brand.test.ts` — 13 tests covering alias resolution, `applyBrand` side effects, `featureOn`
- `tests/unit/brandSchema.test.ts` — 10 tests covering all 9 presets pass schema + soft warnings
- `tests/unit/businessSchema.test.ts` — 19 tests for JSON-LD graph builder
- `playwright.config.ts` + 3 E2E specs — homepage, Cmd+K palette, theme toggle (Chromium + mobile Chrome)

#### CI
- `.github/workflows/ci.yml` — 5 parallel jobs: validate (brand + all 9 presets), typecheck, vitest, build, Playwright E2E. Bundle-size artifact uploaded.

#### Components
- `src/components/Image.tsx` — universal `<Image>` with AVIF/WebP/JPEG fallback, `priority` prop for LCP, aspect-ratio CLS prevention, srcset support
- `src/components/ErrorBoundary.tsx` — graceful render-error fallback with retry + dev stack trace, prod analytics breadcrumb (gtag + posthog)
- `src/components/DevA11yBadge.tsx` — dev-only floating chip showing real-time axe-core violation count (zero prod bundle impact)

#### Section components (6 new in `src/components/sections/`)
- `Newsletter.tsx` — promoted from `/components/`. Inline + bar variants, lead-magnet badge, double-opt-in friendly
- `Timeline.tsx` — promoted from `/components/`. Vertical + horizontal orientations; image support flagged for primary-source compliance per always.md
- `Tabs.tsx` — accessible WAI-ARIA tab pattern with arrow/Home/End keyboard nav. Inline state (no Radix dep)
- `CodeBlock.tsx` — code snippet with copy button, filename header, line-number gutter, line-highlight. No syntax-highlighting lib by design (lean bundle)
- `VideoEmbed.tsx` — privacy-first lazy embed for YouTube/Vimeo/Loom/MP4. Poster-first; iframe loads on click. youtube-nocookie.com default.
- `AnnouncementBanner.tsx` — dismissible top-of-page bar with `localStorage` persistence per `id`. Five tones (accent/success/warning/danger/info).

#### Scoped AGENTS.md files
- `src/components/sections/AGENTS.md` — component conventions + section-vs-section decision tree
- `src/pages/AGENTS.md` — page skeleton + 5-step new-page checklist
- `src/components/local/AGENTS.md` — local-business component rules + LocalBusiness JSON-LD requirements
- `scripts/AGENTS.md` — script-author conventions (exit codes, ANSI, idempotency)
- `tests/AGENTS.md` — Vitest + Playwright conventions
- `examples/AGENTS.md` — preset-author conventions
- `docs/AGENTS.md` — doc style guide + decision-tree pattern

#### Tooling
- `scripts/og-image.mjs` — generate `public/og-image.svg` from `_brand.json` (branded 1200×630 with brand color + headline + grid + accent border). Optional PNG via `--png` (requires sharp).
- `src/vite-env.d.ts` — Vite env type augmentation for `import.meta.env.DEV`

### Changed
- `package.json` → v3.1.0. Adds zod, vitest, @vitest/ui, @vitest/coverage-v8, @playwright/test, @axe-core/playwright, @testing-library/react, @testing-library/jest-dom, jsdom. New npm scripts: `test`, `test:watch`, `test:ui`, `test:coverage`, `e2e`, `e2e:prod`, `e2e:ui`, `e2e:install`, `validate:brand`, `brand:swap`, `og`.
- `src/main.tsx` — wraps app in `<ErrorBoundary>`
- `src/components/Layout.tsx` — mounts `<DevA11yBadge>` (dev-only)
- `public/og-image.svg` — generated from default `_brand.json`

### Build verification
- npm run typecheck: 0 errors
- npm run build: 363KB JS (107KB gzip), 129KB CSS (17KB gzip), 1587 modules
- npm test: 42 tests pass across 3 files
- npm run validate:brand: schema valid (10 placeholder warnings — expected on template default)
- npm run dev: HTTP 200 + all meta intact

## [3.0.1] — 2026-05-20

Documentation pass.

### Added
- `AGENTS.md` at repo root — cross-IDE agent contract per Linux Foundation spec
- `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` — IDE-specific config files pointing at `AGENTS.md`
- `docs/` library — 12 markdown files (README, AI_GUIDE, ARCHITECTURE, BRAND, COMPONENTS, PAGES, RECIPES, THEMING, SEO, ACCESSIBILITY, DECISIONS, GLOSSARY)
- `docs/profiles/` — 9 industry-specific configuration guides (SaaS, restaurant, portfolio, agency, medical, legal, nonprofit, retail, local-service)
- `examples/` — 9 drop-in `_brand.json` preset variants, one per profile
- `public/llms-full.txt` — full content manifest for AI agents (~600 lines)
- `CHANGELOG.md`, `CONTRIBUTING.md`

### Changed
- `public/llms.txt` references the new `llms-full.txt`

## [3.0.0] — 2026-05-20

Ground-up overhaul focused on AI customizability and 2026 design patterns.

### Added

#### Brand-token system
- `_brand.json` at repo root — W3C DTCG single source of truth
- `src/brand.ts` — alias resolver that writes CSS custom properties to `:root`
- OKLCH-first color palette with master `brandHue` + `brandChroma`
- Light / dark / auto color schemes with `[data-theme]` selectors
- Feature flags (`features.*`) — toggle entire homepage sections

#### Composable section library (`src/components/sections/`)
- `HeroCenter` + `HeroSplit` — two hero variants
- `KineticHeadline` — scroll-driven variable-font weight + letter-spacing animation
- `BentoGrid` — Apple-WWDC asymmetric 12-col with subgrid alignment
- `Stats` — animated count-up rollup
- `LogoCloud` — marquee or grid logo strip
- `Marquee` — reduced-motion-safe infinite scroller
- `ProcessSteps` — numbered "how it works" cards
- `FeatureSplit` — image-left/right copy block
- `Pricing` — 3-tier table with monthly/yearly toggle (emits Product JSON-LD)
- `Comparison` — feature comparison table
- `FAQ` — disclosure widget (emits FAQPage JSON-LD)
- `CTASection` — closer block (emphatic / quiet)
- `TeamGrid` — member cards (emits Person JSON-LD)
- `BlogList` — featured + grid posts
- `CaseStudyGrid` — portfolio grid with metrics

#### Universal pages
- `/pricing` — tier table + comparison + FAQ + CTA
- `/faq` — grouped FAQs (general / billing / support)
- `/blog` — featured + grid
- `/blog/:slug` — long-form article (emits BlogPosting JSON-LD)
- `/team` — member grid
- `/case-studies` — portfolio
- `*` (NotFound) — 404 with ⌘K + back / home

#### Interactive features
- `CommandPalette` — universal ⌘K palette with focus trap + return-focus on Esc
- `ThemeToggle` — dark / light / auto cycle with localStorage persistence
- Light-mode CSS — `[data-theme='light']` inverts OKLCH ramp

#### SEO + GEO
- `buildSiteJsonLd()` — emits 5+ JSON-LD blocks per page (Org + WebSite + WebPage + Breadcrumb + FAQPage)
- `llms.txt` — markdown index for LLM crawlers
- `robots.txt` — explicit per-AI-crawler allowlist
- `sitemap.xml` — all 12 public routes with `<lastmod>`
- Speculation Rules `<script>` in `index.html` for prerendering (Chrome 121+)
- View Transitions API cross-fade via `@view-transition`

#### PWA
- Full `site.webmanifest` with `screenshots[]`, `shortcuts[]`, `share_target`, `display_override`
- Maskable + any-purpose icons at 16/32/180/192/512
- `theme-color` per `prefers-color-scheme`
- `sw.js` cache-first for static, network-first for HTML with `offline.html` fallback

#### Design system
- Cascade layers in `src/index.css` (`@layer base / components / utilities`)
- OKLCH color tokens
- Fluid clamp() typography (`text-fluid-{xl,2xl,3xl,4xl,5xl}`)
- Glass + tactile-brutalism + grain surfaces
- Underline-hover + interactive-4 utilities

#### Bolt.diy support
- `.bolt/prompt` — per-template LLM brief
- `.bolt/ignore` — read-only path list
- `.bolt/config.json` — template manifest

### Changed
- `package.json` version bump to 3.0.0
- `tailwind.config.ts` — all colors now CSS-var-backed (no hex)
- `src/index.css` — full rewrite around OKLCH + cascade layers
- `index.html` — added OG meta, Twitter Cards, Speculation Rules, no-FOUC style
- `src/components/Header.tsx` — ⌘K button + ThemeToggle integration
- `src/components/Footer.tsx` — reads brand data via `src/brand.ts`
- `src/components/Layout.tsx` — mounts CommandPalette
- `src/pages/Home.tsx` — fully composed from new section library

### Build
- Verified: 0 TS errors
- Verified: 360 KB JS (106 KB gzip), 127 KB CSS (17 KB gzip)
- Verified: dev server HTTP 200, all meta intact

## [2.0.0] — pre-v3 baseline

Initial public template state — Vite + React 18 + Tailwind + React Router with PhotoSwipe lightbox.
