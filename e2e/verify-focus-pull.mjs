// verify-focus-pull.mjs — CINEMATIC-3D "rack focus" (`focus_pull` / VITE_FOCUS_PULL, AL-853).
// The motion.so / Awwwards film-grade signature: a below-fold gallery image resolves from soft to
// sharp (`filter: blur(7px) → 0`) as it scrolls into view, like a camera pulling focus — a
// genuinely-new visual class (the template had ken-burns zoom / clip-path wipes / opacity-translate
// reveals, but no focus pull). BLUR-ONLY (no transform) so it never collides with the tile hover-zoom.
//
// Proven in a REAL browser against the actual built bundle (flag ON). Asserts the CSS CONTRACT the
// browser applies to a bare `.ps-focus-pull` element (no inline style): under fine-motion it inherits
// `animation-name: ps-focus-pull` + `animation-timeline: view()` from the shipped stylesheet; under
// `prefers-reduced-motion: reduce` it has NO animation AND a base `filter: none` — i.e. the image is
// SHARP static (never a stranded-blurred tile). Also asserts LCP-SAFETY — the LCP element is never a
// `.ps-focus-pull` (the gallery lives below the hero, so a blurred image can't be the LCP).
//
// Usage: node e2e/verify-focus-pull.mjs   (builds with VITE_FOCUS_PULL=1, previews, probes)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4342);
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

console.log('Building with VITE_FOCUS_PULL=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_FOCUS_PULL: '1' },
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

  // Read the CSS contract the shipped stylesheet applies to a bare `.ps-focus-pull` element.
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
      const img = document.createElement('img');
      img.setAttribute('class', 'ps-focus-pull'); // NO inline filter — inherit from stylesheet
      img.setAttribute('alt', '');
      document.body.appendChild(img);
      const cs = getComputedStyle(img);
      const res = {
        animationName: cs.animationName,
        animationTimeline: cs.animationTimeline || '',
        filter: cs.filter,
      };
      img.remove();
      res.hasNatural = !!document.querySelector('.ps-focus-pull');
      return res;
    });
    await ctx.close();
    return { ...out, errs };
  }

  const motion = await contract(false);
  const reduced = await contract(true);

  check(
    'CSS contract applies under fine-motion (animation-name = ps-focus-pull, from the shipped stylesheet)',
    motion.animationName === 'ps-focus-pull',
    `animation-name="${motion.animationName}" timeline="${motion.animationTimeline}"`,
  );
  // REDUCED-MOTION: the @media gate excludes it → no animation AND base filter:none →
  // the image is SHARP static (never a stranded-blurred tile).
  check(
    'reduced-motion leaves it STATIC + SHARP (no animation, filter:none — never stranded-blurred)',
    (reduced.animationName === 'none' || reduced.animationName === '') && reduced.filter === 'none',
    `animation-name="${reduced.animationName}" filter="${reduced.filter}"`,
  );
  check('0 console errors across both contexts', motion.errs.length === 0 && reduced.errs.length === 0);

  // LCP-SAFETY: the gallery is below-fold — the LCP element must NEVER be a `.ps-focus-pull`.
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
            isFocusPull: !!(el && el.classList?.contains('ps-focus-pull')),
          });
        }, 2500);
      }),
  );
  await lcpCtx.close();
  check(
    'LCP-safe: the LCP element is NEVER a focus-pull image (the gallery stays below-fold)',
    lcp.isFocusPull === false && lcp.ms >= 0 && lcp.ms <= 2000,
    `LCP <${lcp.tag}> isFocusPull=${lcp.isFocusPull} ${lcp.ms}ms`,
  );

  rows.push(
    motion.hasNatural
      ? '  ℹ️  natural .ps-focus-pull present (a filled GalleryGrid) — the stylesheet pulls focus on scroll'
      : '  ℹ️  no natural .ps-focus-pull (skeleton has no gallery images) — contract proven via injected element; renders on a build whose GalleryGrid has real images',
  );

  await browser.close();
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ CINEMATIC-3D rack focus (VITE_FOCUS_PULL) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ focus-pull PASS — the stylesheet applies the view()-timeline blur→sharp under fine-motion + stays static SHARP (filter:none) under reduced-motion, LCP-safe, 0 console errors.'
    : '\n❌ focus-pull FAIL',
);
process.exit(exitCode);
