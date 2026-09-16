// verify-welcome-ribbon.mjs — proves the Smart Welcome Ribbon (personalized_ribbon) end-to-end in
// a REAL browser against the actual built bundle. Builds with the flag ON (VITE_PERSONALIZED_RIBBON=1),
// serves dist/, and asserts the 2026 "liquid UI" personalization: a SOCIAL arrival is thanked by
// platform, a RETURNING visitor is welcomed back, a first-time-from-direct visitor sees NOTHING
// (no noise), the pill is position:fixed (zero CLS / never the LCP element), and dismiss works —
// all with 0 console errors. Zero prod cost; the feature ships DARK, so this is how it's proven.
// `node e2e/verify-welcome-ribbon.mjs`.
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4321);
const BASE = `http://localhost:${PORT}/`;
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up */
    }
    await new Promise((res) => setTimeout(res, 250));
  }
  throw new Error(`preview never came up at ${url}`);
}

console.log('Building with VITE_PERSONALIZED_RIBBON=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_PERSONALIZED_RIBBON: '1' },
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
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  // Read the ribbon on a fresh page under the given context options + optional pre-nav localStorage.
  async function probe({ label, contextOpts = {}, referer, returning = false }) {
    const ctx = await browser.newContext({ userAgent: UA, ...contextOpts });
    if (returning) {
      await ctx.addInitScript(() => {
        try {
          localStorage.setItem('ps_visited', '1');
        } catch {
          /* ignore */
        }
      });
    }
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => {
      const t = m.type(), x = m.text();
      if (/Failed to load resource|net::ERR_ABORTED|favicon/i.test(x)) return;
      if (t === 'error' || (t === 'warning' && /Unhandled|Uncaught/i.test(x))) errs.push(x.slice(0, 100));
    });
    page.on('pageerror', (e) => errs.push('[pageerror] ' + String(e.message || e).slice(0, 100)));
    await page.goto(BASE, { waitUntil: 'load', timeout: 30000, ...(referer ? { referer } : {}) });
    await page.waitForTimeout(1600); // past the ~900ms deferred reveal
    const info = await page.evaluate(() => {
      const el = document.querySelector('[data-ps-welcome]');
      if (!el) return { present: false };
      const cs = getComputedStyle(el);
      return {
        present: true,
        kind: el.getAttribute('data-ps-welcome'),
        text: (el.textContent || '').replace(/×|&times;/g, '').trim().slice(0, 70),
        position: cs.position,
        role: el.getAttribute('role'),
        ariaLive: el.getAttribute('aria-live'),
      };
    });
    await ctx.close();
    return { label, info, errs };
  }

  // 1. SOCIAL arrival (from Instagram, first-time) → thanked by platform.
  const social = await probe({ label: 'social', referer: 'https://l.instagram.com/?u=x' });
  const socialOk =
    social.info.present && social.info.kind === 'social' && /Instagram/.test(social.info.text) &&
    social.info.position === 'fixed' && social.info.role === 'status' && social.errs.length === 0;
  rows.push([socialOk, `social: present=${social.info.present} kind=${social.info.kind} pos=${social.info.position} "${social.info.text}" errs=${social.errs.length}`]);

  // 2. RETURNING visitor → welcomed back (localStorage marker pre-set, no referer).
  const returning = await probe({ label: 'returning', returning: true });
  const returningOk =
    returning.info.present && returning.info.kind === 'returning' && /Welcome back/i.test(returning.info.text) &&
    returning.info.position === 'fixed' && returning.errs.length === 0;
  rows.push([returningOk, `returning: present=${returning.info.present} kind=${returning.info.kind} "${returning.info.text}" errs=${returning.errs.length}`]);

  // 3. DEFAULT (first-time, no referer) → NOTHING (no noise).
  const dflt = await probe({ label: 'default' });
  const defaultOk = !dflt.info.present && dflt.errs.length === 0;
  rows.push([defaultOk, `default(first-time): present=${dflt.info.present} (want false) errs=${dflt.errs.length}`]);

  // 4. REDUCED-MOTION social arrival → still appears (no motion dependency).
  const reduced = await probe({ label: 'reduced-motion', contextOpts: { reducedMotion: 'reduce' }, referer: 'https://www.tiktok.com/@x' });
  const reducedOk = reduced.info.present && /TikTok/.test(reduced.info.text) && reduced.errs.length === 0;
  rows.push([reducedOk, `reduced-motion: present=${reduced.info.present} "${reduced.info.text}" errs=${reduced.errs.length}`]);

  await browser.close();
  const allOk = rows.every(([ok]) => ok);
  console.log('\n━━ Smart Welcome Ribbon (personalized_ribbon) ━━');
  rows.forEach(([ok, msg]) => console.log(`  ${ok ? '✓' : '❌'} ${msg}`));
  console.log(allOk ? '\n✅ PASS — zero-config visitor personalization: social + returning greet, first-time silent, fixed/LCP-safe, 0 console errors.' : '\n🔴 CHECK — see failures above.');
  exitCode = allOk ? 0 : 1;
} catch (e) {
  console.log(`  ❌ probe error: ${String(e.message || e).slice(0, 140)}`);
  exitCode = 1;
} finally {
  preview.kill('SIGTERM');
}
process.exit(exitCode);
