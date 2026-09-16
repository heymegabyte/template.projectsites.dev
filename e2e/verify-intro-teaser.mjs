// verify-intro-teaser.mjs — CINEMATIC-3D: the skippable ~1.8s brand INTRO CURTAIN on the first
// homepage visit per session (IntroTeaser.tsx). Proves the effect renders AND — the hard part —
// that it NEVER regresses the hero LCP, against the ACTUAL built bundle in a real browser.
//
// Asserts:
//   1. RENDERS — fresh session on '/' → the intro curtain shows ([data-testid=intro-teaser]).
//   2. LCP-SAFE — the LCP element is the HERO (H1/img in <main>), NOT the intro wordmark, AND LCP
//      ≤ 2000ms. (The hero renders underneath the fixed overlay from t=0, so the curtain can't
//      become/delay the LCP — the whole point of the design.)
//   3. AUTO-DISMISS — the curtain is gone a few seconds later (never traps the visitor).
//   4. SKIP — the Skip button dismisses it immediately (< ~1.2s).
//   5. SESSION-ONCE — a second load in the same session does NOT re-show it.
//   6. REDUCED-MOTION — the curtain NEVER shows (the component returns null).
//   7. 0 console errors across every context.
//
// Usage: node e2e/verify-intro-teaser.mjs   (builds, previews, probes the shipped bundle)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4338);
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

let exitCode = 0;
const rows = [];
const check = (label, ok, detail = '') => {
  rows.push(`  ${ok ? '✓' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) exitCode = 1;
};

console.log('Building (intro teaser ships ON, gated by session + reduced-motion) …');
const build = spawnSync('npx', ['vite', 'build'], { cwd: process.cwd(), env: { ...process.env }, stdio: 'ignore' });
if (build.status !== 0) {
  console.log('::error:: build failed');
  process.exit(1);
}
const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
});

const consoleErrs = (page, sink) => {
  page.on('console', (m) => {
    const t = m.type(),
      x = m.text();
    if (/Failed to load resource|favicon|net::ERR_ABORTED|GL Driver Message|GPU stall/i.test(x)) return;
    if (t === 'error' || (t === 'warning' && /Unhandled|Uncaught/i.test(x))) sink.push(x.slice(0, 100));
  });
  page.on('pageerror', (e) => sink.push('[pageerror] ' + String(e.message || e).slice(0, 100)));
};

try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  // ── Context 1 — fresh session, motion allowed: renders + LCP-safe + auto-dismiss + session-once.
  {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    consoleErrs(page, errs);
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    // The curtain appears post-hydration (useEffect) — give it a beat.
    const shown = await page
      .waitForSelector('[data-testid="intro-teaser"]', { timeout: 8000, state: 'attached' })
      .then(() => true)
      .catch(() => false);
    check('the intro curtain RENDERS on a fresh homepage visit', shown);

    // LCP: element must NOT be inside the intro, and LCP ≤ 2000ms.
    const lcp = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let last = null;
          try {
            new PerformanceObserver((list) => {
              for (const e of list.getEntries()) last = e;
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          } catch {
            /* unsupported */
          }
          setTimeout(() => {
            resolve(
              last
                ? {
                    ms: Math.round(last.startTime),
                    tag: last.element?.tagName || '?',
                    inIntro: !!last.element?.closest?.('.ps-intro'),
                  }
                : null,
            );
          }, 2600);
        }),
    );
    check('LCP ≤ 2000ms with the intro curtain up', lcp !== null && lcp.ms <= 2000, lcp ? `${lcp.ms}ms (${lcp.tag})` : 'no LCP');
    check('the LCP element is the HERO, NOT the intro curtain (LCP not regressed)', lcp !== null && lcp.inIntro === false, lcp ? `inIntro=${lcp.inIntro} el=${lcp.tag}` : 'n/a');

    // Auto-dismiss: gone a couple seconds later.
    await page.waitForTimeout(1200);
    const gone = await page
      .waitForSelector('[data-testid="intro-teaser"]', { state: 'detached', timeout: 4000 })
      .then(() => true)
      .catch(() => false);
    check('the curtain AUTO-DISMISSES (never traps the visitor)', gone);
    check('0 console errors during the intro (context 1)', errs.length === 0, errs.slice(0, 3).join(' | '));

    // Session-once: a second load in the SAME context must NOT re-show it.
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(900);
    const reShown = await page.locator('[data-testid="intro-teaser"]').count();
    check('SESSION-ONCE — the curtain does NOT re-show on a repeat visit', reShown === 0, `count=${reShown}`);
    await page.screenshot({ path: 'e2e/_intro-teaser.png' }).catch(() => {});
    await ctx.close();
  }

  // ── Context 2 — fresh session, Skip dismisses immediately.
  {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    consoleErrs(page, errs);
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    const skip = page.locator('[data-testid="intro-skip"]');
    const hasSkip = await skip.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
    check('a visible Skip control is present', hasSkip);
    if (hasSkip) {
      await skip.click({ timeout: 3000 }).catch((e) => errs.push('skip-click:' + String(e).slice(0, 40)));
      const dismissed = await page
        .waitForSelector('[data-testid="intro-teaser"]', { state: 'detached', timeout: 2500 })
        .then(() => true)
        .catch(() => false);
      check('Skip dismisses the curtain immediately', dismissed);
    }
    check('0 console errors (skip context)', errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ── Context 3 — reduced-motion: the curtain NEVER shows.
  {
    const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errs = [];
    consoleErrs(page, errs);
    await page.goto(BASE, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1200);
    const count = await page.locator('[data-testid="intro-teaser"]').count();
    check('REDUCED-MOTION — the curtain never shows (static, instant content)', count === 0, `count=${count}`);
    check('0 console errors (reduced-motion context)', errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  }

  await browser.close();
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ CINEMATIC-3D intro teaser (skippable brand curtain, LCP-safe, session-once) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ intro-teaser PASS — renders on first homepage visit, LCP stays on the hero (≤2.0s), auto-dismiss + Skip + session-once + reduced-motion-skip, 0 console errors.'
    : '\n❌ intro-teaser FAIL',
);
process.exit(exitCode);
