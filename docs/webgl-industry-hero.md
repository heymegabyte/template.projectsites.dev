# Industry WebGL Hero (opt-in)

An ambient, industry-themed WebGL layer that sits BEHIND the hero content. One fragment
shader, four motion variants — `ember` (restaurant hearth), `rays` (nonprofit light),
`glint` (retail specular sweep), `grid` (professional depth grid) — themed by 11
industry presets (restaurant, nonprofit, retail, professional-services, medical,
wellness, legal, local-service, saas, agency, portfolio; + 8 aliases like `cafe`,
`hvac`, `consulting`). Presets are DATA (palette + uniforms), never forked shader code.

Module: `src/components/webgl/` — `WebGLHero.tsx` (React 19 wrapper),
`webgl-hero-core.mjs` (zero-dep engine), `presets.mjs` (preset data), `webgl-hero.css`
(layer styles + themed static-gradient fallback), plus `*.d.mts` typing siblings for
the no-`allowJs` `tsc -b` build.

## Opt-in semantics vs `WebGLHeroBackdrop`

- **No `webgl` block in `_brand.json`** (the default): `brand.webgl` is `undefined`
  and `HeroCenter` / `HeroSplit` render the pre-existing auto backdrop —
  `WebGLHeroBackdrop` with its variant derived from `brand.themeStyle`. Unchanged.
- **Explicit `webgl` block** (even `{}`): the heroes swap to
  `<WebGLHero vertical={brand.business.businessClass} webgl={brand.webgl} />` — the
  industry engine resolves the vertical's preset and applies the block's per-field
  overrides. Guard lives in `src/components/sections/HeroVariants.tsx` (both heroes).

## `webgl` block schema (all fields optional)

```jsonc
"webgl": {
  "variant":    "ember",                          // "ember" | "rays" | "glint" | "grid"
  "background": "#1a0f0a",                        // base canvas color, #rrggbb
  "palette":    ["#c2572b", "#f0a850", "#6b5a42"], // [glow, accent, atmosphere] #rrggbb
  "speed":      0.55,                              // global time multiplier, 0.2–2.0
  "intensity":  1.0,                               // effect strength, 0.3–1.5
  "density":    8,                                 // particle/line density, 3–18
  "grain":      0.025                              // film grain, 0–0.06
}
```

Plain values (above) and DTCG `{"$value": …}` tokens are both accepted —
`src/brandSchema.ts` and `npm run validate:brand` validate either form, and the
runtime resolver in `src/brand.ts` unwraps them identically.

## Safety

Never the LCP (decorative aria-hidden layer; GL init deferred to window load + idle).
`prefers-reduced-motion` / no WebGL / context loss → the themed static CSS gradient on
the layer div is the whole treatment, zero errors. Pauses on tab-hide + offscreen.

## Syncing

`webgl-hero-core.mjs` + `presets.mjs` + `WebGLHero.tsx` + `webgl-hero.css` are synced
VERBATIM from projectsites.dev `apps/project-sites/templates/webgl/`. Edit UPSTREAM
there first, then copy here byte-identical (and update the `.d.mts` siblings if an
export signature changed). Do not hand-patch the copies in this repo.
