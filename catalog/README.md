# Component Catalog

`components.json` is the typed catalog of every section component under
`src/components/sections/` — one entry per file, written from the actual JSX (not guessed).

## Entry schema

```
{ id, component, scenario, requiredFacts[], editingControls[], semanticFallback,
  motion { type: none|css|scroll-driven|webgl, reducedMotion }, browserApis[],
  a11yNotes, budget { maxKbJs, maxKbImg }, tests[] }
```

- `scenario` — the visitor job the section serves (what it's FOR, not what it looks like).
- `requiredFacts` — verified-fact keys the component may NOT render without. `[]` = copy-driven.
- `semanticFallback` — what renders when facts/media are absent (scrub firewall, self-hide, defaults).
- `budget` — gzipped JS ceiling (component + exclusive deps) and combined image-transfer ceiling at 1280w.

## The provenance rule (non-negotiable)

Components with non-empty `requiredFacts` render ONLY when those facts are verified in the
creative brief / research pack — **never fabricate a fact to unlock a section.** No invented
menu items, prices, products, named people, quotes, stats, live counts, logos, timeline
events, FAQ pairs, or donate links. Most components self-hide via `src/lib/placeholders.ts`
(scrubText / isPlaceholder / hasRealImage) as defense-in-depth, but three render props
verbatim (`MetricRow`, `Quote`, `Spotlight`) — for those, this catalog IS the gate.

## How site-generation consumes it

1. Extract evidence from the creative brief (`_brand.json`, research pack, citations).
2. For each page, match visitor jobs to `scenario` fields to shortlist components.
3. Select a shortlisted component only when EVERY `requiredFacts` key is verified;
   missing facts → pick the fact-free sibling (e.g. `TeamGrid` → `TeamRoles`) or omit.
4. Respect `budget` per section and the route-level ceilings (JS ≤ 200KB gz/route).
5. Honor `motion.reducedMotion` + `a11yNotes` as shipped invariants — don't regress them.

## Drift gate

`npm run validate:catalog` (`scripts/validate-catalog.mjs`) fails the build when a sections/
component lacks an entry, an entry points at a missing file, or `requiredFacts` isn't an array.
Add the catalog entry in the SAME commit that adds/renames a section component.
