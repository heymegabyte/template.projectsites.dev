// verify-perf-flush.mjs — REAL-browser proof that perfMonitor flushes the definitive
// LCP/CLS/INP once on page-hide (the fix for the empty visibilitychange handler).
// Serves the freshly-built dist/, stubs window.gtag + window.posthog to capture the
// web_vital_* events, dispatches `pagehide` (flushFinal is bound to it with no
// visibility guard), and asserts ≥1 event carries meta.final === true + CLS is present.
// Zero API cost, no rebuild — runs against the actual built bundle. `node e2e/verify-perf-flush.mjs`.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4319);
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

/** Poll until the preview server answers 200, or throw after ~15s. */
async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error(`preview server never came up at ${url}`);
}

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
});

let exitCode = 0;
try {
  const base = `http://localhost:${PORT}/`;
  await waitForServer(base);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: UA });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  // Stub analytics BEFORE the app bundle loads so perfMonitor.emit() lands here.
  await page.addInitScript(() => {
    window.__perfEvents = [];
    const push = (name, payload) => window.__perfEvents.push({ name, payload });
    window.gtag = (_kind, event, payload) => push(event, payload);
    window.posthog = { capture: (event, payload) => push(event, payload) };
  });

  await page.goto(base, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1200); // let LCP + layout-shift observers accrue

  // flushFinal is bound to `pagehide` (no visibilityState guard) — the honest trigger.
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(150);

  const events = await page.evaluate(() => window.__perfEvents || []);
  await browser.close();

  const finals = events.filter((e) => e.payload && e.payload.meta && e.payload.meta.final === true);
  const clsFinal = finals.find((e) => e.name === 'web_vital_cls');

  console.log('\n━━ perfMonitor on-hide flush (CWV finalization) ━━');
  console.log(`  captured ${events.length} web_vital_* event(s); ${finals.length} marked final`);
  finals.forEach((e) => console.log(`  ✓ FINAL ${e.name} = ${Number(e.payload.value).toFixed(3)} (${e.payload.rating ?? '—'})`));

  if (!clsFinal) {
    console.log('  ❌ no final CLS event — flushFinal did not run (the bug is NOT fixed)');
    exitCode = 1;
  } else if (consoleErrors.length) {
    console.log(`  ❌ ${consoleErrors.length} console error(s): ${consoleErrors.slice(0, 3).join(' | ')}`);
    exitCode = 1;
  } else {
    console.log('  ✓ definitive CLS flushed on page-hide, marked final · 0 console errors — FIX VERIFIED');
  }
} catch (e) {
  console.log(`  ❌ probe error: ${String(e.message || e)}`);
  exitCode = 1;
} finally {
  preview.kill('SIGTERM');
}
process.exit(exitCode);
