// verify-line-draw.mjs — CINEMATIC-3D hand-drawn accent stroke (`line_draw` / VITE_LINE_DRAW).
// The Awwwards/Codrops "stroke reveals" signature: a below-fold section-eyebrow accent line DRAWS
// itself in (SVG `stroke-dashoffset`) as the section scrolls into view, via native
// `animation-timeline: view()` — a genuinely-new visual class (the template had translates/scales/
// tilts/opacity-reveals but no stroke-draw).
//
// Proven in a REAL browser against the actual built bundle (flag ON). Asserts the CSS CONTRACT the
// browser applies to a bare `.ps-line-accent path` (no inline style): under fine-motion it inherits
// `animation-name: ps-line-draw` from the shipped stylesheet; under `prefers-reduced-motion: reduce`
// it has NO animation AND a base `stroke-dashoffset: 0px` — i.e. the line is drawn STATIC (never a
// stranded-invisible undrawn stroke). Also asserts LCP-SAFETY — the LCP element is never inside a
// `.ps-line-accent` (the accent lives below-fold, never the hero).
//
// Usage: node e2e/verify-line-draw.mjs   (builds with VITE_LINE_DRAW=1, previews, probes)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4339);
const BASE = `http://localhost:${PORT}/`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

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

console.log('Building with VITE_LINE_DRAW=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_LINE_DRAW: '1' },
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

  // Read the CSS contract the shipped stylesheet applies to a bare `.ps-line-accent path`.
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
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'ps-line-accent');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', 'M1 5 Q 33 1 66 4 T 131 3'); // NO inline stroke-dashoffset — inherit from stylesheet
      svg.appendChild(p);
      document.body.appendChild(svg);
      const cs = getComputedStyle(p);
      const res = {
        animationName: cs.animationName,
        animationTimeline: cs.animationTimeline || '',
        strokeDashoffset: cs.strokeDashoffset,
        strokeDasharray: cs.strokeDasharray,
      };
      svg.remove();
      res.hasNatural = !!document.querySelector('.ps-line-accent path');
      return res;
    });
    await ctx.close();
    return { ...out, errs };
  }

  const motion = await contract(false);
  const reduced = await contract(true);

  // MOTION: the shipped stylesheet applies the scroll-driven stroke-draw to a bare path.
  check(
    'CSS contract applies under fine-motion (animation-name = ps-line-draw, from the shipped stylesheet)',
    motion.animationName === 'ps-line-draw',
    `animation-name="${motion.animationName}" timeline="${motion.animationTimeline}"`,
  );
  // REDUCED-MOTION: the @media gate excludes it → no animation AND base stroke-dashoffset:0 →
  // the accent is DRAWN static (never a stranded-invisible undrawn stroke).
  check(
    'reduced-motion leaves it STATIC + FULLY DRAWN (no animation, stroke-dashoffset:0 — never invisible)',
    (reduced.animationName === 'none' || reduced.animationName === '') && reduced.strokeDashoffset === '0px',
    `animation-name="${reduced.animationName}" stroke-dashoffset="${reduced.strokeDashoffset}"`,
  );
  // The dash length is set (so the undrawn→drawn range exists) in BOTH prefs.
  check(
    'stroke-dasharray is set (the draw range exists)',
    motion.strokeDasharray !== 'none' && motion.strokeDasharray !== '',
    `dasharray="${motion.strokeDasharray}"`,
  );
  check('0 console errors across both contexts', motion.errs.length === 0 && reduced.errs.length === 0);

  // LCP-SAFETY: the accent is below-fold — the LCP element must NEVER be inside a `.ps-line-accent`.
  const lcpCtx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
  const lcpPage = await lcpCtx.newPage();
  await lcpPage.goto(BASE, { waitUntil: 'load', timeout: 45000 });
  const lcp = await lcpPage.evaluate(
    () =>
      new Promise((resolve) => {
        let last = null;
        try {
          new PerformanceObserver((list) => {
            const es = list.getEntries();
            last = es[es.length - 1];
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch {
          /* unsupported */
        }
        setTimeout(() => {
          const el = last && last.element;
          resolve({
            ms: last ? Math.round(last.startTime) : -1,
            tag: el ? el.tagName.toLowerCase() : 'none',
            isLineAccent: !!(el && el.closest?.('.ps-line-accent')),
          });
        }, 2500);
      }),
  );
  await lcpCtx.close();
  check(
    'LCP-safe: the LCP element is NEVER inside a line-accent (the accent stays below-fold)',
    lcp.isLineAccent === false && lcp.ms >= 0 && lcp.ms <= 2000,
    `LCP <${lcp.tag}> isLineAccent=${lcp.isLineAccent} ${lcp.ms}ms`,
  );

  rows.push(
    motion.hasNatural
      ? '  ℹ️  natural .ps-line-accent present (filled FeatureSplit) — the stylesheet draws it on scroll'
      : '  ℹ️  no natural .ps-line-accent (skeleton FeatureSplit headline is a placeholder token) — contract proven via injected element; renders on a promoted+filled below-fold FeatureSplit build',
  );

  await browser.close();
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ CINEMATIC-3D hand-drawn accent stroke (VITE_LINE_DRAW) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ line-draw PASS — the stylesheet applies the view()-timeline stroke-draw under fine-motion + stays static fully-drawn (stroke-dashoffset:0) under reduced-motion, LCP-safe, 0 console errors.'
    : '\n❌ line-draw FAIL',
);
process.exit(exitCode);
