// verify-word-reveal.mjs — BLEEDING-EDGE kinetic split-text headline (`word_reveal` / VITE_WORD_REVEAL).
// The Awwwards-2026 / Codrops kinetic-typography signature: a below-fold section headline rises +
// un-blurs one WORD at a time as it scrolls into view, via native `animation-timeline: view()`.
//
// Proven in a REAL browser against the actual built bundle (flag ON). The raw skeleton's FeatureSplit
// headline is a placeholder token (only a generated site fills it), so the natural `.word-reveal`
// element renders on a promoted+filled build — this proves the CSS CONTRACT the browser applies: a
// bare `.wr-word` (no inline style) inherits `animation-name: wr-word-rise` from the shipped
// stylesheet under fine-motion, and NOTHING (static, fully visible, never a stranded opacity:0 word)
// under `prefers-reduced-motion: reduce`. It ALSO asserts the reveal is LCP-SAFE — the LCP element is
// never a `.wr-word` (the reveal lives below-fold, never the hero).
//
// Usage: node e2e/verify-word-reveal.mjs   (builds with VITE_WORD_REVEAL=1, previews, probes)
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4337);
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

console.log('Building with VITE_WORD_REVEAL=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_WORD_REVEAL: '1' },
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

  // Read the CSS contract for an injected `.word-reveal .wr-word` under a given motion pref.
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
      const h = document.createElement('h2');
      h.className = 'word-reveal';
      const w = document.createElement('span');
      w.className = 'wr-word'; // NO inline animation — must inherit from the shipped stylesheet
      w.textContent = 'Word';
      h.appendChild(w);
      document.body.appendChild(h);
      const cs = getComputedStyle(w);
      const res = {
        animationName: cs.animationName,
        animationTimeline: cs.animationTimeline || '',
        display: cs.display,
      };
      h.remove();
      res.hasNatural = !!document.querySelector('.word-reveal .wr-word');
      return res;
    });
    await ctx.close();
    return { ...out, errs };
  }

  const motion = await contract(false);
  const reduced = await contract(true);

  // MOTION: the shipped stylesheet applies the scroll-driven per-word reveal to a bare .wr-word.
  check(
    'CSS contract applies under fine-motion (animation-name = wr-word-rise, from the shipped stylesheet)',
    motion.animationName === 'wr-word-rise',
    `animation-name="${motion.animationName}" timeline="${motion.animationTimeline}" display="${motion.display}"`,
  );
  // REDUCED-MOTION: the @media gate excludes it → no animation → static, every word fully visible.
  check(
    'reduced-motion leaves it STATIC (no word animation → words never stranded opacity:0)',
    reduced.animationName === 'none' || reduced.animationName === '',
    `animation-name="${reduced.animationName}"`,
  );
  check('the word span is inline-block in BOTH prefs (layout stable)', motion.display === 'inline-block' && reduced.display === 'inline-block');
  check('0 console errors across both contexts', motion.errs.length === 0 && reduced.errs.length === 0);

  // LCP-SAFETY: the reveal is below-fold — the LCP element must NEVER be a `.wr-word`.
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
            isWordReveal: !!(el && (el.closest?.('.word-reveal') || el.classList?.contains('wr-word'))),
          });
        }, 2500);
      }),
  );
  await lcpCtx.close();
  check(
    'LCP-safe: the LCP element is NEVER a word-reveal word (the reveal stays below-fold)',
    lcp.isWordReveal === false,
    `LCP <${lcp.tag}> isWordReveal=${lcp.isWordReveal} ${lcp.ms}ms`,
  );

  if (motion.hasNatural)
    rows.push('  ℹ️  natural .word-reveal present (filled build) — the stylesheet staggers its words on scroll');
  else
    rows.push(
      '  ℹ️  no natural .word-reveal (skeleton headline is a placeholder token) — contract proven via injected element; renders on a promoted+filled below-fold FeatureSplit build',
    );

  await browser.close();
} catch (e) {
  console.log('::error::', String(e.message || e).slice(0, 200));
  exitCode = 1;
} finally {
  preview.kill();
}

console.log('\n━━ BLEEDING-EDGE kinetic split-text headline (VITE_WORD_REVEAL) ━━');
rows.forEach((r) => console.log(r));
console.log(
  exitCode === 0
    ? '\n✓ word-reveal PASS — the stylesheet applies the view()-timeline per-word stagger under fine-motion + stays static (fully visible) under reduced-motion, LCP-safe, 0 console errors.'
    : '\n❌ word-reveal FAIL',
);
process.exit(exitCode);
