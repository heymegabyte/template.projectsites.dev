#!/usr/bin/env node
/**
 * Build-time site-integrity validator — prevents the defect classes from the
 * 2026-08-25 correction so they can never recur:
 *   1. LIGHT-ON-LIGHT CONTRAST — hardcoded `text-white`/`bg-white`/`border-white`
 *      on a theme surface is invisible on the 6 light verticals. Use the
 *      theme-aware tokens (text-text / text-text-muted / text-text-subtle /
 *      bg-surface / border-border) instead. A genuinely-dark surface on the same
 *      element (bg-[#0..], bg-primary, bg-black) or a `contrast-dark-ok` marker
 *      is allowed; the `components/local/` lightbox is exempt.
 *   2. INTERNAL LINKS THAT 404 — every `to="/x"` / `href="/x"` must resolve to a
 *      real <Route> (App.tsx) or a known static file (sitemap.xml, robots.txt…).
 *
 * Static source analysis — fast (<1s), zero build dependency, keeps the site
 * build well under 10 min. Run via `npm run validate:site`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const violations = [];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    // Ship-only: skip test / spec / story files — they are never part of the deployed site, so a
    // `<a href="/x">` fixture inside one must NOT trip the internal-link 404 gate and fail the build
    // (AL-738: a MagneticButton.test.tsx `/x` fixture broke EVERY new site build fleet-wide).
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.(test|spec|stories)\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

// ── Known routes (App.tsx) + static public/ files ──
const appTsx = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
const routes = new Set([...appTsx.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]));
const STATIC_OK = new Set([
  '/sitemap.xml', '/robots.txt', '/humans.txt', '/site.webmanifest', '/manifest.json',
  '/favicon.ico', '/browserconfig.xml', '/feed.xml', '/atom.xml', '/feed.json',
  '/.well-known/security.txt', '/offline.html', '/llms.txt',
]);

function linkResolves(link) {
  const base = link.split('#')[0] || '/';
  if (routes.has(base) || STATIC_OK.has(base)) return true;
  for (const r of routes) {
    if (!r.includes(':')) continue;
    if (new RegExp('^' + r.replace(/:[^/]+/g, '[^/]+') + '$').test(base)) return true;
  }
  return false;
}

const CONTRAST_EXEMPT_DIR = /\/components\/local\//;

// ── Empty-H1 + empty-meta-description prevention ──
// A page that renders `{SOME_TOKEN}` inside an <h1> ships a BLANK heading on any
// vertical whose content pack never emits that token: the fill-safety-net writes
// "" (not a leaked `{TOKEN}`), so BOTH the {TOKEN}-leak gate (nothing leaked) AND
// the exactly-1-H1 gate (count = 1) pass while the H1 is empty — an SEO (no
// keyworded H1) + a11y (empty heading) defect. Ref: /contact shipped an empty
// <h1> on every vertical until 2026-08-28. Gate: every H1 token must be emitted
// by ≥1 content pack (feature-gated tokens like PRICING_HEADLINE are emitted by
// their verticals' packs, so they pass). Portable: skips silently if examples/ absent.
const PACK_TOKENS = new Set();
const examplesDir = path.join(ROOT, 'examples');
if (fs.existsSync(examplesDir)) {
  for (const pf of fs.readdirSync(examplesDir).filter((n) => /^_content\..+\.json$/.test(n))) {
    try {
      const obj = JSON.parse(fs.readFileSync(path.join(examplesDir, pf), 'utf8'));
      for (const [k, v] of Object.entries(obj)) if (v != null && String(v).trim() !== '') PACK_TOKENS.add(k);
    } catch { /* a malformed pack shouldn't crash the gate */ }
  }
}
function emptyRiskTokens(src) {
  const out = [];
  const seen = new Set();
  const add = (tok, kind) => { const key = kind + ':' + tok; if (!seen.has(key)) { seen.add(key); out.push({ tok, kind }); } };
  // inline <h1>…</h1> (About/Services/Contact render `{'{X_HEADLINE}'}` in a span)
  for (const block of src.match(/<h1[\s>][\s\S]*?<\/h1>/g) || []) {
    for (const m of block.matchAll(/\{([A-Z][A-Z0-9_]{3,})\}/g)) add(m[1], 'h1');
  }
  // component heading marked as="h1" with a token headline (Pricing pattern)
  for (const m of src.matchAll(/as=["']h1["']/g)) {
    const win = src.slice(Math.max(0, m.index - 220), m.index + 220);
    for (const hm of win.matchAll(/headline=["']\{([A-Z][A-Z0-9_]{3,})\}["']/g)) add(hm[1], 'h1');
  }
  // useSEO({ description: '{X_META_DESCRIPTION}' }) — a bare-token meta description
  // no pack emits ships an EMPTY <meta name="description"> (blank SERP snippet).
  // Only whole-token values (quoted OR backticked) count; computed `${brand…}`
  // literals always have text and are correctly skipped. SCOPED to the useSEO(...)
  // call window (not the whole file) so an ordinary `description:` OBJECT KEY on
  // section data (MenuEntry / ServiceEntry / etc.) is never mistaken for the page
  // meta description — false-positive fix, validator-precision-discipline.
  for (const s of src.matchAll(/useSEO\s*\(/g)) {
    const win = src.slice(s.index, s.index + 500);
    for (const m of win.matchAll(/description:\s*(['"`])\{([A-Z][A-Z0-9_]{3,})\}\1/g)) add(m[2], 'meta');
  }
  return out;
}

for (const f of walk(SRC)) {
  const rel = path.relative(ROOT, f);
  const src = fs.readFileSync(f, 'utf8');

  // 1) internal-link 404 check
  for (const m of src.matchAll(/\b(?:to|href)=["'](\/[^"'${}][^"'${}]*)["']/g)) {
    const link = m[1];
    if (!linkResolves(link)) {
      violations.push({ kind: 'link-404', file: rel, detail: `internal link "${link}" matches no <Route> or static file — it would 404` });
    }
  }

  // 2) empty-H1 / empty-meta risk — page <h1> + useSEO description tokens must be
  //    emitted by a content pack (else they fill EMPTY and ship a blank heading /
  //    meta description that still passes the leak-gate + exactly-1-H1 gate).
  if (PACK_TOKENS.size && /\/pages\//.test(rel)) {
    for (const { tok, kind } of emptyRiskTokens(src)) {
      if (!PACK_TOKENS.has(tok)) {
        const surface = kind === 'h1' ? 'an EMPTY <h1>' : 'a BLANK <meta name="description">';
        const where = kind === 'h1' ? 'an <h1>' : 'useSEO({description})';
        violations.push({ kind: `empty-${kind}-risk`, file: rel, detail: `renders {${tok}} in ${where} but NO content pack emits it — every vertical would ship ${surface}. Emit ${tok} in scripts/gen-content-packs.mjs, or use a static/computed value.` });
      }
    }
  }

  // 3) contrast check
  if (CONTRAST_EXEMPT_DIR.test(rel)) continue;
  src.split('\n').forEach((line, i) => {
    if (/contrast-dark-ok/.test(line)) return;
    if (/bg-\[#0[0-9a-fA-F]/.test(line) || /\bbg-primary\b/.test(line) || /\bbg-black\b/.test(line)) return;
    const m = line.match(/\b(text-white(?:\/\d+)?|placeholder-white\/\d+|placeholder:text-white\/\d+|bg-white\/[\d.[\]]+|border-white\/\d+)\b/);
    if (m) {
      violations.push({ kind: 'contrast', file: rel, line: i + 1, detail: `hardcoded light class "${m[1]}" is invisible on light themes — use theme tokens (text-text / text-text-muted / text-text-subtle / bg-surface / border-border)` });
    }
  });
}

if (violations.length) {
  console.error(`\n✗ validate-site: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error(`  [${v.kind}] ${v.file}${v.line ? ':' + v.line : ''} — ${v.detail}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ validate-site: ${routes.size} routes; internal links resolve; no light-on-light contrast; every page <h1> + meta-description token emitted by a pack (${PACK_TOKENS.size} pack tokens)`);
