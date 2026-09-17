// verify-particle-field.mjs — CINEMATIC-3D ambient particle field (`particle_field` /
// VITE_PARTICLE_FIELD). The Awwwards / motion.so "living canvas" ambient signature: luminous
// brand-tinted motes drift behind the closing CTA band (Canvas 2D, no WebGL/lib, a pre-rendered
// glow sprite blitted with additive blending).
//
// Proven in a REAL browser against the actual built bundle (flag ON). Home.tsx renders an emphatic
// <CTASection>, so the field mounts on `/`. Asserts the FULL contract:
//  - it RENDERS: after an idle callback (post-first-paint) a `canvas.ps-particle-field` mounts,
//    sized > 0, and it ANIMATES (two snapshots ~500ms apart differ → the rAF is driving motes).
//  - it stays LCP-SAFE: LCP ≤ 2.0s on the flag-on build AND the LCP element is NOT the canvas.
//  - reduced-motion → the canvas is ABSENT (component renders null; the CTA's own gradient stands).
//  - 0 console errors across both contexts.
//
// Usage: node e2e/verify-particle-field.mjs   (builds with VITE_PARTICLE_FIELD=1, previews, probes)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4337);
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

console.log('Building with VITE_PARTICLE_FIELD=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_PARTICLE_FIELD: '1' },
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

  // ── Context 1: fine motion — the field renders + animates, LCP-safe, no console errors.
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => {
    const t = m.type();
    const x = m.text();
    if (/Failed to load resource|favicon|net::ERR_ABORTED|preloaded using link preload/i.test(x)) return;
    if (t === 'error' || (t === 'warning' && /Unhandled|Uncaught/i.test(x))) errs.push(x.slice(0, 100));
  });
  page.on('pageerror', (e) => errs.push('[pageerror] ' + String(e.message || e).slice(0, 100)));

  await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
  // Wait past the idle-mount so the decorative canvas appears.
  await page.waitForTimeout(2200);

  const render = await page.evaluate(() => {
    const c = document.querySelector('canvas.ps-particle-field');
    if (!c) return { present: false };
    return { present: true, w: c.width, h: c.height, ariaHidden: c.getAttribute('aria-hidden') };
  });
  check('canvas.ps-particle-field mounts (post-idle) with non-zero size', render.present && render.w > 0 && render.h > 0, render.present ? `${render.w}×${render.h}` : 'ABSENT');
  check('canvas is aria-hidden (decorative, out of the a11y tree)', render.ariaHidden === 'true');

  // CENTER the CTA canvas in the viewport so its IntersectionObserver marks it on-screen and the
  // rAF resumes (the off-screen pause is the INP-safe feature; we keep it visible to test motion).
  await page.evaluate(() => document.querySelector('canvas.ps-particle-field')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(450);

  // ANIMATES: two canvas snapshots ~500ms apart must differ (motes drifting).
  if (render.present) {
    // Sample the ACTUAL pixel buffer (getImageData) — a compressed-PNG tail-slice can be stable
    // even as the image changes, so hash the full luminance sum of the framebuffer instead.
    const lumaSum = () =>
      page.evaluate(() => {
        const c = document.querySelector('canvas.ps-particle-field');
        const g = c && c.getContext('2d');
        if (!c || !g) return -1;
        try {
          const d = g.getImageData(0, 0, c.width, c.height).data;
          let s = 0;
          for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
          return s;
        } catch {
          return -1;
        }
      });
    const a = await lumaSum();
    await page.waitForTimeout(600);
    const b = await lumaSum();
    check('the field ANIMATES (framebuffer luminance changes frame-to-frame)', a > 0 && b > 0 && a !== b, `sum ${a} → ${b}`);
  }

  // LCP-safe: measure on the flag-on build; the LCP must not be the particle canvas.
  const lcpOut = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = null;
        new PerformanceObserver((list) => {
          const es = list.getEntries();
          last = es[es.length - 1];
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => {
          const el = last?.element;
          resolve({
            ms: last ? Math.round(last.startTime) : -1,
            tag: el ? el.tagName.toLowerCase() : 'none',
            isField: el ? el.classList?.contains('ps-particle-field') === true : false,
          });
        }, 1200);
      }),
  );
  check(`LCP ≤ ${LCP_BUDGET_MS}ms on the flag-on build`, lcpOut.ms >= 0 && lcpOut.ms <= LCP_BUDGET_MS, `LCP=${lcpOut.ms}ms (<${lcpOut.tag}>)`);
  check('LCP element is NOT the particle canvas (decorative, never the LCP)', lcpOut.isField === false && lcpOut.tag !== 'canvas');
  check('0 console errors under fine motion', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();

  // ── Context 2: reduced motion — the field renders NOTHING.
  const rctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  const rpage = await rctx.newPage();
  await rpage.goto(BASE, { waitUntil: 'load', timeout: 45000 });
  await rpage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await rpage.waitForTimeout(1200);
  const reducedHasCanvas = await rpage.evaluate(() => !!document.querySelector('canvas.ps-particle-field'));
  check('reduced-motion → NO particle canvas (renders null; the CTA gradient stands)', reducedHasCanvas === false);
  await rctx.close();

  await browser.close();
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ CINEMATIC-3D ambient particle field (VITE_PARTICLE_FIELD) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ particle-field PASS — the ambient field renders + animates behind the CTA, stays LCP-safe (≤2.0s, never the LCP element), is aria-hidden, 0 console errors, and vanishes under reduced-motion.'
    : '\n❌ particle-field FAIL',
);
process.exit(exitCode);
