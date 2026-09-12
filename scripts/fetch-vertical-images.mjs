#!/usr/bin/env node
// Fetches real, relevant per-vertical hero + about photos from the Unsplash API and
// prints a paste-ready `IMG` object for scripts/gen-content-packs.mjs. The returned
// urls.regular are images.unsplash.com CDN links — already in the build validator's
// external-host allowlist, so no R2 download is needed.
//
// Usage:
//   UNSPLASH_KEY=$(get-secret UNSPLASH_ACCESS_KEY) node scripts/fetch-vertical-images.mjs
//
// Then paste the printed `const IMG = {...}` block into gen-content-packs.mjs and run it.
const KEY = process.env.UNSPLASH_KEY || process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) { console.error('Set UNSPLASH_KEY (or UNSPLASH_ACCESS_KEY).'); process.exit(1); }

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

// Per-vertical [heroQuery, aboutQuery]. Tuned for relevance + professionalism.
const QUERIES = {
  medical: ['modern dental clinic interior', 'smiling dentist with patient'],
  wellness: ['serene yoga studio interior', 'woman practicing yoga'],
  legal: ['modern law office interior', 'professional lawyer portrait'],
  restaurant: ['warm restaurant interior dining', 'chef plating gourmet food'],
  'local-service': ['plumber repairing pipes', 'service technician tools'],
  nonprofit: ['community volunteers helping', 'group of volunteers smiling'],
  retail: ['cozy independent shop interior shelves', 'shopkeeper arranging products on shelves'],
  saas: ['software team working laptops office', 'modern tech startup workspace'],
  agency: ['creative agency team meeting', 'designer workspace desk'],
  portfolio: ['creative photographer workspace', 'artist working studio'],
};

async function fetchOne(q) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}`
    + `&per_page=1&orientation=landscape&content_filter=high&client_id=${KEY}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Version': 'v1' } });
  if (!r.ok) return null;
  const j = await r.json();
  const p = (j.results || [])[0];
  return p ? { url: p.urls.regular, alt: (p.alt_description || q).slice(0, 90) } : null;
}

const out = {};
for (const [v, [hq, aq]] of Object.entries(QUERIES)) {
  const hero = await fetchOne(hq);
  const about = await fetchOne(aq);
  out[v] = { hero, about };
  process.stderr.write(`${v.padEnd(14)} ${hero ? 'hero✓' : 'hero✗'} ${about ? 'about✓' : 'about✗'}\n`);
}

console.log('const IMG = {');
for (const [v, x] of Object.entries(out)) {
  const alt = (x.about?.alt || '').replace(/["']/g, ' ');
  console.log(`  ${JSON.stringify(v)}: { hero: ${JSON.stringify(x.hero?.url || '')}, `
    + `about: ${JSON.stringify(x.about?.url || '')}, aboutAlt: ${JSON.stringify(alt)} },`);
}
console.log('};');
