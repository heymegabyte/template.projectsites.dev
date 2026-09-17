// verify-scroll-cinema.mjs — CINEMATIC-3D scroll-driven depth-cascade (`scroll_cinema` /
// VITE_SCROLL_CINEMA). The motion.so / Awwwards "content emerges from depth" signature: a group's
// direct children cascade forward out of Z-depth (perspective + rotateX + translateZ, staggered)
// as it scrolls into view, via native `animation-timeline: view()` — ZERO JS, compositor-driven.
//
// Proven in a REAL browser against the actual built bundle (flag ON). The raw template skeleton
// carries no NATURAL `[data-depth-cascade]` group yet (the primitive is dark + adopters convert a
// flat `.reveal-on-view` group to <DepthCascade> as they promote — like clip_reveal's natural
// element only appearing on a filled build), so this proves the CSS CONTRACT the browser applies:
// a bare `.ps-depth-cascade > *` element (no inline style) inherits `animation-name:
// ps-depth-cascade-in` from the shipped stylesheet under fine-motion, and NOTHING (static, never
// stuck-in-depth) under `prefers-reduced-motion: reduce` — AND it stays LCP-safe (the flag-on
// build's LCP is ≤ 2.0s and the LCP element is never inside a cascade).
//
// Usage: node e2e/verify-scroll-cinema.mjs   (builds with VITE_SCROLL_CINEMA=1, previews, probes)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4335);
const BASE = `http://localhost:${PORT}/`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
const LCP_BUDGET_MS = 2000;

async function waitForServer(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`preview never came up at ${url}`);
}

console.log('Building with VITE_SCROLL_CINEMA=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_SCROLL_CINEMA: '1' },
  stdio: 'ignore',
});
if (build.status !== 0) {
  console.log('::error:: enabled build failed');
  process.exit(1);
}
const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
});

let exitCode = 0;
const rows = [];
const check = (label, ok, detail = '') => {
  rows.push(`  ${ok ? '✓' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) exitCode = 1;
};

try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  // Read the CSS contract for an injected `.ps-depth-cascade > *` element under a given motion pref.
  async function contract(reduced) {
    const ctx = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1280, height: 900 },
      ...(reduced ? { reducedMotion: 'reduce' } : {}),
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => {
      const t = m.type(),
        x = m.text();
      if (/Failed to load resource|favicon|net::ERR_ABORTED/i.test(x)) return;
      if (t === 'error' || (t === 'warning' && /Unhandled|Uncaught/i.test(x))) errs.push(x.slice(0, 90));
    });
    page.on('pageerror', (e) => errs.push('[pageerror] ' + String(e.message || e).slice(0, 90)));
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    const out = await page.evaluate(() => {
      const wrap = document.createElement('div');
      wrap.className = 'ps-depth-cascade'; // NO inline style — must inherit from the shipped stylesheet
      const item = document.createElement('div');
      wrap.appendChild(item);
      document.body.appendChild(wrap);
      const wcs = getComputedStyle(wrap);
      const ics = getComputedStyle(item);
      const res = {
        containerPerspective: wcs.perspective,
        itemAnimationName: ics.animationName,
        itemAnimationTimeline: ics.animationTimeline || '',
      };
      wrap.remove();
      res.hasNatural = !!document.querySelector('[data-depth-cascade="1"]');
      return res;
    });
    await ctx.close();
    return { ...out, errs };
  }

  // Measure LCP on the flag-on build + confirm the LCP element is NOT inside a cascade group.
  async function lcp() {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    const out = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let last = null;
          new PerformanceObserver((list) => {
            const es = list.getEntries();
            last = es[es.length - 1];
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          // Give the observer a beat to settle, then report the final LCP candidate.
          setTimeout(() => {
            const el = last?.element;
            resolve({
              ms: last ? Math.round(last.startTime) : -1,
              inCascade: el ? !!el.closest('[data-depth-cascade]') : false,
              tag: el ? el.tagName.toLowerCase() : 'none',
            });
          }, 1500);
        }),
    );
    await ctx.close();
    return out;
  }

  const motion = await contract(false);
  const reduced = await contract(true);
  const lcpOut = await lcp();

  // MOTION: the shipped stylesheet applies the depth-cascade to a bare .ps-depth-cascade child.
  check(
    'CSS contract applies under fine-motion (child animation-name = ps-depth-cascade-in, from the shipped stylesheet)',
    motion.itemAnimationName === 'ps-depth-cascade-in',
    `animation-name="${motion.itemAnimationName}" timeline="${motion.itemAnimationTimeline}"`,
  );
  check(
    'container establishes a 3D perspective under fine-motion (depth is real, not flat)',
    motion.containerPerspective !== 'none' && motion.containerPerspective !== '',
    `perspective="${motion.containerPerspective}"`,
  );
  // REDUCED-MOTION: the @media gate excludes it → no animation → static, never stuck-in-depth.
  check(
    'reduced-motion leaves items STATIC (no cascade animation applied)',
    reduced.itemAnimationName === 'none' || reduced.itemAnimationName === '',
    `animation-name="${reduced.itemAnimationName}"`,
  );
  check('0 console errors across both contexts', motion.errs.length === 0 && reduced.errs.length === 0);
  // LCP-SAFE: shipping the flag-on CSS never pushed LCP past budget, and the hero (LCP) is never a cascade item.
  check(
    `LCP ≤ ${LCP_BUDGET_MS}ms on the flag-on build`,
    lcpOut.ms >= 0 && lcpOut.ms <= LCP_BUDGET_MS,
    `LCP=${lcpOut.ms}ms (element <${lcpOut.tag}>)`,
  );
  check('LCP element is NOT inside a depth-cascade group (hero stays the LCP)', lcpOut.inCascade === false);
  rows.push(
    motion.hasNatural
      ? '  ℹ️  natural [data-depth-cascade] present (an adopting section is promoted) — CSS drives its cascade on scroll'
      : '  ℹ️  no natural [data-depth-cascade] yet (primitive is dark; adopters convert a flat reveal to <DepthCascade>) — contract proven via injected element',
  );
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ CINEMATIC-3D scroll depth-cascade (VITE_SCROLL_CINEMA) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ scroll-cinema PASS — the stylesheet applies the view()-timeline 3D depth-cascade under fine-motion, stays static under reduced-motion, 0 console errors, and the flag-on build stays LCP-safe (≤2.0s, hero never a cascade item).'
    : '\n❌ scroll-cinema FAIL',
);
process.exit(exitCode);
