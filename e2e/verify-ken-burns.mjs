// verify-ken-burns.mjs — CINEMATIC-3D "living imagery": a below-fold FeatureSplit image slowly
// SCALES as it scrolls through the viewport (Ken-Burns, the Obys/Immersive-Garden signature), via
// native `animation-timeline: view()` on a `.ps-ken-burns` wrapper. Ships ON (no flag) — gated only
// by @supports + prefers-reduced-motion.
//
// Proven in a REAL browser against the actual built bundle. The raw skeleton's FeatureSplit image is
// a placeholder `{ABOUT_IMAGE_URL}` (only a generated site fills it), so the natural wrapper renders
// on a promoted+filled build — here we prove the CSS CONTRACT the browser applies: a bare
// `.ps-ken-burns` element (no inline style) inherits `animation-name: ps-ken-burns-drift` +
// `animation-timeline: view()` from the shipped stylesheet under fine-motion, and NOTHING (static,
// natural 1.0, never stuck mid-zoom) under `prefers-reduced-motion: reduce`.
//
// Usage: node e2e/verify-ken-burns.mjs   (builds, previews, probes the shipped stylesheet)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4332);
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

console.log('Building (Ken-Burns ships ON) …');
const build = spawnSync('npx', ['vite', 'build'], { cwd: process.cwd(), env: { ...process.env }, stdio: 'ignore' });
if (build.status !== 0) {
  console.log('::error:: build failed');
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

  // Read the CSS contract for an injected `.ps-ken-burns` element under a given motion pref.
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
      const el = document.createElement('div');
      el.className = 'ps-ken-burns'; // NO inline style — must inherit from the shipped stylesheet
      document.body.appendChild(el);
      const cs = getComputedStyle(el);
      const res = { animationName: cs.animationName, animationTimeline: cs.animationTimeline || '' };
      el.remove();
      res.hasNatural = !!document.querySelector('.ps-ken-burns'); // natural wrapper (filled build)
      return res;
    });
    await ctx.close();
    return { ...out, errs };
  }

  const motion = await contract(false);
  const reduced = await contract(true);

  // MOTION: the shipped stylesheet applies the scroll-driven zoom to a bare .ps-ken-burns.
  check(
    'CSS contract applies under fine-motion (animation-name = ps-ken-burns-drift, from the shipped stylesheet)',
    motion.animationName === 'ps-ken-burns-drift',
    `animation-name="${motion.animationName}" timeline="${motion.animationTimeline}"`,
  );
  // view()-timeline present → the zoom is scroll-driven, not time-driven (never runs on load).
  check(
    'animation is scroll-driven (animation-timeline = view())',
    /view\(\)/.test(motion.animationTimeline),
    `timeline="${motion.animationTimeline}"`,
  );
  // REDUCED-MOTION: the @media gate excludes it → no animation → image at natural 1.0, never stuck.
  check(
    'reduced-motion leaves it STATIC (no zoom animation applied)',
    reduced.animationName === 'none' || reduced.animationName === '',
    `animation-name="${reduced.animationName}"`,
  );
  check('0 console errors across both contexts', motion.errs.length === 0 && reduced.errs.length === 0);
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ CINEMATIC-3D Ken-Burns living-imagery (view()-timeline scroll-zoom) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ ken-burns PASS — the stylesheet applies the view()-timeline scale zoom under fine-motion + stays static under reduced-motion, 0 console errors.'
    : '\n❌ ken-burns FAIL',
);
process.exit(exitCode);
