// verify-text-scramble.mjs — kinetic text-scramble (`text_scramble` / VITE_TEXT_SCRAMBLE), the
// Awwwards SOTD tier-1 micro-interaction: a mono eyebrow "decodes" (cycling glyphs → real text) on
// first view + on hover. Wired to the HERO + the final CTA eyebrows (the two tier-1 conversion
// labels). Ships DARK; opt in with VITE_TEXT_SCRAMBLE=1.
//
// Proven in a REAL browser against the actual built bundle (flag ON). Hard-gate-safe BY
// CONSTRUCTION, verified here on the CTA eyebrow ("Ready?" — the raw demo hero tagline is a
// content-pack placeholder scrubbed empty, so the CTA eyebrow is the demo-rendered target):
//   • a11y  — the eyebrow keeps a `.sr-only` node with the REAL text (screen-reader + SEO name)
//             while the visible layer is `aria-hidden` → the accessible text is NEVER scrambled.
//   • decode — scrolled into view under fine-motion, the visible glyphs differ from the real text
//             mid-animation, then SETTLE back to the exact real text (never blank, never stuck).
//   • reduced-motion — `prefers-reduced-motion: reduce` shows the real text immediately, no churn.
//   • CLS  — the visible layer preserves the exact character COUNT (mono → zero width jitter).
//   • 0 console errors.
//
// Usage: node e2e/verify-text-scramble.mjs   (builds with VITE_TEXT_SCRAMBLE=1, previews, probes)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4333);
const BASE = `http://localhost:${PORT}/`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
// A ScrambleText node uniquely has BOTH an .sr-only (real text) child AND an aria-hidden (visual)
// child — the skip-link + other .sr-only nodes don't, so this never mis-selects.
const SCRAMBLE = 'span:has(> span.sr-only):has(> [aria-hidden="true"])';

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

console.log('Building with VITE_TEXT_SCRAMBLE=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_TEXT_SCRAMBLE: '1' },
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

  // ── FINE-MOTION: scroll the eyebrow into view → it decodes → settles to the real text ──
  {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
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

    const node = page.locator(SCRAMBLE).first();
    const present = (await node.count()) > 0;
    check('a ScrambleText eyebrow renders (flag ON, real eyebrow present)', present, present ? '' : 'no .sr-only+aria-hidden eyebrow found');
    if (present) {
      const srReal = ((await node.locator('span.sr-only').first().textContent().catch(() => '')) || '').trim();
      check('a11y: eyebrow keeps a .sr-only node with the REAL text', srReal.length > 0, `sr-only="${srReal.slice(0, 40)}"`);

      // scroll it into view to fire the IntersectionObserver decode, then sample fast for a scramble frame
      await node.scrollIntoViewIfNeeded().catch(() => {});
      const visual = node.locator('[aria-hidden="true"]').first();
      let sawScramble = false;
      let lenOk = true;
      for (let i = 0; i < 40; i++) {
        const v = ((await visual.textContent().catch(() => '')) || '').trim();
        if (v && srReal && v !== srReal && v.length === srReal.length) sawScramble = true;
        if (v && srReal && v.length !== srReal.length) lenOk = false;
        await page.waitForTimeout(25);
      }
      check('decode: visible glyphs differed from the real text mid-animation (scramble ran)', sawScramble);
      check('CLS: visible layer preserved the exact character count every frame (mono → no jitter)', lenOk);

      await page.waitForTimeout(900); // let the ~620ms decode finish
      const settled = ((await visual.textContent().catch(() => '')) || '').trim();
      check('settle: visible layer resolves back to the EXACT real text', settled === srReal, `"${settled.slice(0, 40)}"`);
    }
    check('0 console errors (fine-motion)', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ── REDUCED-MOTION: no scramble — the real text shows immediately on view ──
  {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    const node = page.locator(SCRAMBLE).first();
    if ((await node.count()) > 0) {
      const srReal = ((await node.locator('span.sr-only').first().textContent().catch(() => '')) || '').trim();
      await node.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(120);
      const v = ((await node.locator('[aria-hidden="true"]').first().textContent().catch(() => '')) || '').trim();
      check('reduced-motion: visible layer is the real text on view (no scramble churn)', v === srReal, `"${v.slice(0, 40)}"`);
    } else {
      check('reduced-motion: (no eyebrow to check)', true);
    }
    await ctx.close();
  }

  await browser.close();
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ BLEEDING-EDGE kinetic text-scramble (VITE_TEXT_SCRAMBLE) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ text-scramble PASS — eyebrow decodes on view + settles to the real text, a11y real-text preserved, static under reduced-motion, 0 console errors.'
    : '\n❌ text-scramble FAIL',
);
process.exit(exitCode);
