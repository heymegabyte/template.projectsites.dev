# AGENTS.md — Cross-IDE Agent Contract

> **Read this first.** This file is the shared contract for every AI coding agent (Codex, Cursor, Windsurf, Copilot, Aider, Zed, Warp, RooCode, bolt.diy, Claude Code). It lives at the repo root and follows the **agents.md** spec maintained by the Agentic AI Foundation under the Linux Foundation.
>
> Tool-specific files (`CLAUDE.md`, `.bolt/prompt`, `.cursor/rules/`) extend — never contradict — this file.

## TL;DR (read in 60 seconds)

1. **`_brand.json` is the only place that defines brand identity.** Edit it; do not edit hex colors elsewhere.
2. **15 pages, 21 section components, dark/light/auto themes, ⌘K palette — all built in.** Compose; don't reinvent.
3. **Tailwind tokens point at CSS variables.** Use `bg-accent`, `text-text-muted`, `border-border`. Never write `#0a0a1a`.
4. **Every `{PLACEHOLDER}` string must be replaced before shipping.** Grep for `{` to find them all.
5. **`npm install && npm run build` must pass before you mark work complete.**
6. **For ANY non-trivial customization, start with the master prompt** at [`PROMPT.md`](./PROMPT.md). The 7-step deterministic protocol produces build-ready output in one pass.

## Project identity

| Field | Value |
| --- | --- |
| Name | `projectsites-template` |
| Version | `3.0.0` |
| Repo | `heymegabyte/template.projectsites.dev` |
| Purpose | Production-ready cinematic website template for AI-generated sites |
| Stack | Vite 5 + React 18 + TypeScript 5 + Tailwind 3 + React Router 6 |
| Entry | `src/main.tsx` → `src/App.tsx` |
| Build | `npm run build` → `dist/` |
| Dev | `npm run dev` → http://localhost:5173 |
| Typecheck | `npm run typecheck` |

## Architecture in 5 lines

```
_brand.json   → src/brand.ts (applyBrand) → CSS vars on :root
:root vars    → src/index.css (@layer) + tailwind.config.ts (color tokens)
Tailwind utils → src/components/* (every component reads `bg-accent` etc.)
src/App.tsx   → 15 routes, all wrapped by src/components/Layout.tsx
Layout        → Header + Footer + Lightbox + CommandPalette + BackToTop + SkipLink
```

## Conventions

### File layout

```
_brand.json                    single source of truth (W3C DTCG tokens)
.bolt/                         bolt.diy meta — DO NOT EDIT
docs/                          extended reference (read on demand)
examples/                      pre-built _brand.json variants per industry
public/                        static assets (favicon, sw.js, manifest, robots)
src/
├── brand.ts                   token resolver — applies CSS vars at boot
├── main.tsx                   entry — calls applyBrand()
├── App.tsx                    routes
├── index.css                  @layer base / utilities (OKLCH)
├── components/
│   ├── Layout.tsx             page chrome wrapper
│   ├── Header.tsx, Footer.tsx
│   ├── CommandPalette.tsx     ⌘K palette
│   ├── ThemeToggle.tsx
│   ├── Lightbox.tsx           PhotoSwipe auto-mount
│   ├── sections/              15 composable section components
│   ├── local/                 local-business specific (NAP, BeforeAfter, Map)
│   └── ui/                    primitives (Button, Card)
├── pages/                     15 routes (Home, About, Pricing, FAQ, Blog, …)
├── lib/                       businessSchema, altText, cursor, utils
└── hooks/                     useSEO, useInView
```

### Code style

- **TypeScript strict**. No `any` (use `unknown`). No `@ts-ignore`.
- **Interface > type** for object shapes.
- **Relative imports inside `src/`** use the `@/` alias (`import { Button } from '@/components/ui/button'`).
- **camelCase** for variables/functions, **PascalCase** for types/components, **CONSTANT_CASE** for module-level constants.
- **JSDoc the WHY**, not the WHAT. Skip docstrings that just restate the function signature.
- **All forms use Zod for validation** if the form is more than 3 fields. (Add Zod when you wire a backend; not currently a dep.)

### Tailwind tokens — use these, not hex

| Surface | Token |
| --- | --- |
| Page background | `bg-background` |
| Card / glass panel | `bg-surface` or `.glass` / `.glass-strong` |
| Elevated panel | `bg-surface-elevated` |
| Brand primary | `bg-primary` / `text-primary` |
| Brand accent | `bg-accent` / `text-accent` / `border-accent` |
| Body text | `text-text` |
| Muted text | `text-text-muted` |
| Subtle text | `text-text-subtle` |
| Border | `border-border` |
| Success / warning / danger / info | `text-success` etc. |

Fonts: `font-heading`, `font-body`, `font-mono`. Fluid sizes: `text-fluid-{xl,2xl,3xl,4xl,5xl}`. Radii: `rounded-{sm,md,lg,xl,2xl}`. Easing: `ease-brand`. Durations: `duration-{fast,base,slow}`.

### Brand-token mutation

Always go through `_brand.json`. The resolver in `src/brand.ts` handles aliasing (`{color.brandHue}` → `240`). Mutations:

```jsonc
{
  "color": {
    "brandHue":    { "$value": "190" },        // ← change to reskin
    "brandChroma": { "$value": "0.22" },       // 0.05 pastel → 0.30 vivid
    "primary":     { "$value": "oklch(0.62 {color.brandChroma} {color.brandHue})" }
  },
  "colorScheme": { "$value": "auto" },         // dark | light | auto
  "themeStyle":  { "$value": "editorial" },    // ← visual PERSONALITY — ALWAYS set it (see below)
  "features":    { "pricing": { "$value": true } }  // toggle homepage sections
}
```

**`themeStyle` is the site's visual PERSONALITY** — it bundles the font pairing + radius scale + shadow character + motion + a matching flourish. **ALWAYS set it to fit the business**; it is what stops every generated site from looking identical (color alone is not enough). Pick ONE:

- `classic` — saas, tech, auto-repair, general modern brands (geometric, confident)
- `editorial` — legal, medical, dental, nonprofit, consulting (serif, calm, trustworthy)
- `warm` — restaurant, salon, gym, wellness, family/kids (rounded, soft, inviting)
- `luxe` — fine dining, high-end retail, real-estate, hospitality, jewelry (refined serif, premium)
- `brutalist` — creative agency, portfolio, events, streetwear, bold brands (high-impact, hard-edged)

To let the chosen preset SUPPLY the font pairing + radii, **omit the `font` and `radius` groups** from `_brand.json` (keep only colors/values you genuinely extracted from the source brand — those still win per-key). Full reference: `src/themePresets.ts` + `docs/BRAND.md`.

### Conversion intent — the CTAs must match how the business is patronized

`themeStyle` sets the LOOK; **conversion intent** sets the primary CTAs. Getting it wrong is a wrong-vertical defect just like a wrong-vertical H1 — it makes the delivered site read as a generic retail template instead of the real business. Pick the mode by how a customer actually converts, then use its CTAs (never a shopping cart unless the mode is `retail`):

- **retail** (jewelry, florist, bookstore, hardware, clothing, gift, furniture) — SELLS products → *Shop / Browse the collection / Add to cart / Buy* + store hours. **The only mode where cart / "Free shipping" / "Shop now" language is on-brand.**
- **quickserve** (**ice cream / creamery, coffee shop, cafe, bakery, donut, juice bar, smoothie, deli, sandwich, food truck**) — a WALK-UP counter, patrons ORDER and GO → *See our flavors / See the menu / Order online (pickup) / Order ahead / Visit us / Find us / Today's specials*. ❌ NEVER **"Reserve a table" / "Reservations"** (that's full-service dining — a scoop/coffee/pastry counter takes no table bookings) and ❌ no e-commerce cart. Hero image = the product + counter (a scoop case, cones, a pastry case, an espresso bar), NEVER an empty fine-dining dining room. (A **coffee ROASTER** is the exception → hospitality, it's an artisan/tasting brand.)
- **hospitality** (restaurant, bistro, diner, steakhouse, bar, brewery, **distillery, winery, cidery**, hotel, tasting room) — people VISIT / TASTE / DINE / BOOK → *Reserve a table / Book a tour / View the menu / Visit us / Order for pickup*. Present offerings as a **menu or collection to explore**, never a store to check out. ❌ NEVER "Shop now / Add to cart / Free shipping / 30-day returns" as the hero CTA (a small "where to buy our bottles" link is fine as a secondary).
- **service** (plumbing, HVAC, salon, spa, clinic, dental, auto, gym) — customers BOOK / REQUEST → *Book now / Schedule service / Request a free quote / Call us*. ❌ no cart.
- **professional** (legal, accounting, financial, real-estate, consulting, agency) — clients CONSULT / RETAIN → *Book a consultation / Contact us / Request a proposal*. ❌ no cart.
- **nonprofit** (soup kitchen, food bank, charity, church) — supporters DONATE / VOLUNTEER → *Donate / Volunteer / Get involved*. ❌ no retail cart as the primary CTA.

Match the **hero image** to the same intent — a scoop case / espresso bar / pastry counter (quickserve), a tasting room / dining room (hospitality), a job-site / consultation / community photo (service/professional/nonprofit) — never a generic retail storefront or product-rack stock image on a non-retail business, and never an empty fine-dining dining room on a walk-up counter.

### When to add a new section vs reuse

Reuse `src/components/sections/*` whenever possible. Adding a new section is a last resort — most layout needs are covered by composing existing ones with different `eyebrow` / `headline` / `tiles` props.

Decision tree:
- "I need a feature grid" → `BentoGrid`
- "I need before/after stats" → `Stats`
- "I need a pricing table" → `Pricing`
- "I need a comparison chart" → `Comparison`
- "I need a step-by-step process" → `ProcessSteps`
- "I need an image-left/right block" → `FeatureSplit`
- "I need an FAQ" → `FAQ` (emits FAQPage JSON-LD — required for AI search)
- "I need a closer / CTA" → `CTASection`
- "I need an asymmetric grid of features" → `BentoGrid` with `span: 'lg' | 'md' | 'sm'`

Only invent a new component when none of the above fit. Then add it to `src/components/sections/`, export it from `index.ts`, and document it in `docs/COMPONENTS.md`.

### Naming new pages

- File: `src/pages/MyPage.tsx` (PascalCase)
- Default export the component
- Add to `src/App.tsx` with kebab-case path: `<Route path="/my-page" element={<MyPage />} />`
- Add to `public/sitemap.xml` with `<lastmod>`
- Add to `src/components/CommandPalette.tsx` `DEFAULT_ACTIONS` if it's a primary route

## Hard rules

1. **Never delete `_brand.json` or `src/brand.ts`** — the theme system depends on them.
2. **Never hardcode hex colors** in components. Use Tailwind tokens.
3. **Never use `npm install <pkg>` ad-hoc.** Add to `package.json` and let `npm install` resolve.
4. **All images need `alt`.** Empty `alt=""` only for purely decorative images, paired with `aria-hidden="true"`.
5. **Every email / phone / address is a real link** (`mailto:`, `tel:`, Google Maps URL).
6. **Reduced motion must be respected.** Any new animation needs a `@media (prefers-reduced-motion: reduce)` zero-out.
7. **`⌘K` opens the command palette** — do not remove the `CommandPalette` mount in `Layout.tsx`.
8. **Service worker stays cache-first for static, network-first for HTML** — see `public/sw.js`.

## Programmatic checks (run before declaring done)

```bash
npm install         # idempotent; safe to re-run
npm run typecheck   # zero errors
npm run build       # zero errors, dist/ produced
```

Lighthouse / axe-core / Playwright are run by the projectsites.dev deploy pipeline post-merge — not required locally.

## Quality bar

| Metric | Target |
| --- | --- |
| LCP | ≤ 2.5s |
| INP | ≤ 200ms (cinematic target: ≤ 100ms) |
| CLS | ≤ 0.1 |
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Lighthouse SEO | ≥ 95 |
| axe-core violations | 0 |
| Console errors | 0 |
| `{PLACEHOLDER}` strings in production | 0 |
| JSON-LD blocks per page | ≥ 5 |
| Homepage real content | ≥ 800 words (aim 900–1100); sub-pages ≥ 400 |
| JS bundle (gzip) per route | ≤ 250 KB |

**Content density is a quality gate, not a nicety.** A thin ~600-word homepage of one-line sections LOSES the beat-the-source density dimension. Every section carries 2–4 real sentences (a genuine description under each service, a real About story, a Why-Us block, a 3–5 Q&A FAQ, a local-context paragraph) — grounded in the business's actual story/services/reviews, never filler or repetition.

## What this repo does NOT do

- ❌ Server-side rendering (this is a pure client SPA — fine for marketing sites; not fine if you need SSR/ISR)
- ❌ Authentication (add Clerk / Auth.js downstream if needed)
- ❌ Database (add libsql / D1 / Supabase downstream)
- ❌ Payments (add Stripe checkout link or hosted checkout)
- ❌ CMS (content lives in `src/pages/*` as TS data; swap for MD or headless CMS downstream)
- ❌ Email sending (`Newsletter` component POSTs to `/api/newsletter` — implement on backend)

Anything in this list = explicit project decision, not omission. Don't shoehorn these in without an architectural decision.

## Where to dig deeper

- `PROMPT.md` — **the master one-shot prompt.** Start here for any customization.
- `prompts/` — eight specialized prompts (brand-only, hero copy, FAQs, local JSON-LD, slop audit, URL migration, new section, SEO audit)
- `docs/PROMPTS.md` — full prompt-library reference
- `examples/applied/` — worked examples showing complete output for real briefs
- `CLAUDE.md` — architecture overview (mirrors this file's first half)
- `README.md` — end-user-facing intro
- `docs/ARCHITECTURE.md` — full deep dive into how everything fits
- `docs/BRAND.md` — `_brand.json` complete reference + alias resolution
- `docs/COMPONENTS.md` — every section component with props + examples
- `docs/PAGES.md` — every route with what's on it
- `docs/RECIPES.md` — copy-paste customizations per industry
- `docs/THEMING.md` — light/dark/auto + hue rotation + custom palettes
- `docs/SEO.md` — JSON-LD graph, OG, sitemap, robots, llms.txt
- `docs/ACCESSIBILITY.md` — WCAG 2.2 AA checklist + ADA deadlines
- `docs/AI_GUIDE.md` — LLM-specific guide (you're already reading the executive summary)
- `docs/DECISIONS.md` — architectural decisions + rationale
- `docs/profiles/*.md` — industry-specific presets (SaaS, restaurant, portfolio, agency, medical, legal, nonprofit, retail)
- `examples/_brand.*.json` — drop-in brand presets

## Contact for human

Brian Zalewski · hey@megabyte.space · projectsites.dev
