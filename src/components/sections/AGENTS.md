# AGENTS.md — src/components/sections/

> Scoped conventions for composable section components. Inherits from root `AGENTS.md`.

## Purpose

`sections/` holds page-level building blocks that compose into routes. Each file in this folder is one section: hero, bento, pricing, FAQ, etc.

## Hard rules

1. **Outer element is `<section>`** — never `<div>`. The semantics matter for screen readers.
2. **Always centered on a container** — `max-w-container-wide mx-auto px-6` for full-width, `max-w-container-normal` for tighter, `max-w-container-prose` for blog-style.
3. **Standard padding** — `py-24 md:py-32` for major sections, `py-16 md:py-24` for smaller.
4. **Accept these standard props** in this order:
   ```ts
   {
     eyebrow?: string;
     headline?: string;
     description?: string;
     /* …component-specific props… */
     className?: string;
   }
   ```
5. **Eyebrow + headline pattern** — when present, wrap in a centered `text-center mb-12 reveal-on-view` block:
   ```tsx
   {(eyebrow || headline) && (
     <div className="text-center mb-12 reveal-on-view">
       {eyebrow && <span className="text-accent text-sm font-mono tracking-widest uppercase">{eyebrow}</span>}
       {headline && <h2 className="text-3xl md:text-5xl font-bold font-heading mt-4 mb-4 text-text">{headline}</h2>}
       {description && <p className="text-text-muted max-w-2xl mx-auto">{description}</p>}
     </div>
   )}
   ```
6. **Reveal animations** — use `.reveal-on-view` on the items that should animate in. Don't use Framer Motion or other JS libs.
7. **Tailwind tokens for colors** — never hardcode hex. Use `bg-accent`, `text-text-muted`, `border-border`.
8. **All clickable rows have `min-h-[44px]`** — WCAG 2.5.8 target size.
9. **Lazy-load images** — `loading="lazy"` on every `<img>` except the LCP. Set `loading="eager"` + `fetchPriority="high"` on the LCP only.
10. **Export from `index.ts`** — every component MUST be re-exported there.

## File layout

```ts
// src/components/sections/MyThing.tsx
import { /* lucide icons */ } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MyThingItem {  // ← named export the data shape
  /* … */
}

interface Props {
  /* eyebrow, headline, description, data props, className */
}

/**
 * 1-3 sentence JSDoc describing what this section does + when to use it.
 * Mention any JSON-LD it emits (e.g. "Emits FAQPage JSON-LD").
 */
export function MyThing({ … }: Props) {
  return (
    <section className={cn('py-24 md:py-32 max-w-container-wide mx-auto px-6', className)}>
      {/* …optional header block… */}
      {/* …content… */}
    </section>
  );
}

export default MyThing;
```

## Add a new section — checklist

- [ ] File named `PascalCase.tsx`
- [ ] Default + named exports
- [ ] JSDoc on the main export
- [ ] Standard props in standard order
- [ ] Tailwind tokens only — zero hex
- [ ] `min-h-[44px]` on interactive elements
- [ ] Image lazy unless explicitly the LCP
- [ ] `prefers-reduced-motion` respected (no JS animation that bypasses it)
- [ ] Added to `index.ts` exports
- [ ] Added to `docs/COMPONENTS.md` with props + example
- [ ] Added to `llms-full.txt` section component list
- [ ] If non-obvious: ADR added in `docs/DECISIONS.md`

## Anti-patterns

- ❌ Hardcoding `#0a0a1a`, `text-white/50`, etc. Use tokens.
- ❌ Custom `<div>` wrappers that should be `<section>` / `<article>` / `<aside>`.
- ❌ Forcing a particular page layout — accept `className` so the caller can override container width / padding.
- ❌ Reading `_brand.json` directly inside a section — let the caller pass data in.
- ❌ Heavy animation libs — Tailwind animate + CSS scroll-driven covers 95% of needs.
- ❌ "Generic" sections that try to do everything — make smaller, focused components.

## When to invent a new section vs reuse

```
Layout need        → reuse this
─────────────────────────────────────
Feature grid       → BentoGrid (use span:'sm' for symmetric, mix for asymmetric)
Numbered steps     → ProcessSteps
Image + copy       → FeatureSplit
Long quote / story → FeatureSplit with `visual` slot
Logos              → LogoCloud
Multiple FAQs      → FAQ
Two CTAs side-by-side → CTASection (primary + secondary)
Pricing            → Pricing
Comparison         → Comparison
Stats              → Stats
Timeline           → Timeline
Tabs               → Tabs
Code snippets      → CodeBlock
Video              → VideoEmbed
Promo banner       → AnnouncementBanner
Newsletter         → Newsletter
Team               → TeamGrid
Blog index         → BlogList
Work samples       → CaseStudyGrid
```

## Industry-specific sections (AL-620)

First-class, tokenized, JSON-LD-emitting blocks for vertical needs. All four are ALREADY imported + rendered in `Home.tsx` (token-gated, self-hiding) — the container `domain-builder` FILLS their tokens for the matching vertical instead of creating raw files. Each returns `null` until real data is present (scrubText firewall) and emits its own schema.org block.

```
Restaurant / café / bar / bakery                → Menu               (Menu JSON-LD)
Salon / spa / trades / pro / medical            → ServiceMenu        (OfferCatalog)
Nonprofit / charity                             → DonationTiers      (DonateAction — needs a REAL donate URL)
Retail (jewelers/books/records/outdoor/plants)  → FeaturedCollection (ItemList / Product)
```

Hours + live "open now" are NOT an industry section — they render in `LocationMap` (map + weekly grid + open-now chip + directions), driven by the freeform `hours` token via `businessSchema` (`describeToday` + `OpeningHoursSpecification` JSON-LD). Never add a second hours section.

Extra rules for these (on top of the contract above):

1. **Prices flow to schema** — any price/amount whose leading number parses becomes an `Offer`/`MenuItem`/`Product` price (`priceCurrency:'USD'`).
2. **Every CTA is tracked** — `data-bcl="{menu-view|book|call|donate|product-view|shop-all}"` on every action link (feeds PostHog micro-conversions).
3. **Gate on REAL data, never proxies** — a `description:` object key or a bare phone number must NEVER make a section appear. DonationTiers requires a real donate URL. Unfilled tokens → the whole section hides.

Covered by `IndustrySections.test.tsx` (null-on-token + JSON-LD emission) and the prod probe `apps/project-sites/e2e/site-quality/verify-industry-sections.mjs`.

If your need doesn't fit any of the above, AND you can't compose it from existing components, propose a new one via issue first.
