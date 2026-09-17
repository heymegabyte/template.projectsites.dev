// verify-exit-intent.mjs — proves Exit-Intent Recovery (exit_intent) end-to-end in a REAL browser
// against the actual built bundle. Builds with the flag ON (VITE_EXIT_INTENT=1), serves dist/, and
// asserts: the offer is ABSENT at load (LCP-safe), the desktop cursor-leaves-top signal (after the
// 4s arm grace) surfaces the card with an AI-DERIVED action (tel:/mailto:/contact) + eyebrow, Esc
// closes it, and it's SESSION-ONCE (a second exit signal does not reopen) — all with 0 console
// errors. Zero prod cost; the feature ships DARK, so this is how it's proven. `node e2e/verify-exit-intent.mjs`.
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.PORT || 4322);
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

// Dispatch the classic desktop exit signal: cursor leaves through the TOP edge (clientY≤0, no
// relatedTarget). The component listens on `document` for exactly this.
const fireExitSignal = () =>
  document.dispatchEvent(
    new MouseEvent('mouseout', { clientY: -1, relatedTarget: null, bubbles: true }),
  );

console.log('Building with VITE_EXIT_INTENT=1 …');
const build = spawnSync('npx', ['vite', 'build'], {
  cwd: process.cwd(),
  env: { ...process.env, VITE_EXIT_INTENT: '1' },
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
const add = (ok, msg) => rows.push([ok, msg]);
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ userAgent: UA, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => {
    const t = m.type(), x = m.text();
    if (/Failed to load resource|net::ERR_ABORTED|favicon/i.test(x)) return;
    if (t === 'error' || (t === 'warning' && /Unhandled|Uncaught/i.test(x))) errs.push(x.slice(0, 100));
  });
  page.on('pageerror', (e) => errs.push('[pageerror] ' + String(e.message || e).slice(0, 100)));

  await page.goto(BASE, { waitUntil: 'load', timeout: 30000 });

  // 1. LCP-SAFE: nothing rendered at load — the offer only mounts on the exit signal.
  const atLoad = await page.locator('[data-testid="exit-intent-offer"]').count();
  add(atLoad === 0, `absent at load (LCP-safe): count=${atLoad} (want 0)`);

  // 2. Firing BEFORE the 4s arm grace must NOT open it (no accidental early fire).
  await page.evaluate(fireExitSignal);
  await page.waitForTimeout(300);
  const early = await page.locator('[data-testid="exit-intent-offer"]').count();
  add(early === 0, `does not fire before the 4s arm grace: count=${early} (want 0)`);

  // 3. After the grace, the exit signal surfaces the card with an AI-derived action.
  await page.waitForTimeout(4200);
  await page.evaluate(fireExitSignal);
  await page.waitForSelector('[data-testid="exit-intent-offer"]', { timeout: 5000 }).catch(() => {});
  const shown = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="exit-intent-offer"]');
    const cta = document.querySelector('[data-testid="exit-intent-cta"]');
    return {
      present: !!card,
      role: card?.getAttribute('role') || '',
      modal: card?.getAttribute('aria-modal') || '',
      eyebrow: /before you go/i.test(card?.textContent || ''),
      href: cta?.getAttribute('href') || '',
      label: cta?.textContent?.trim() || '',
      focused: document.activeElement === cta, // primary action gets focus on open
    };
  });
  add(shown.present && shown.role === 'dialog' && shown.modal === 'true', `card opens on exit signal (role=dialog modal=${shown.modal})`);
  add(shown.eyebrow, `renders the "Before you go" recovery copy`);
  add(/^(tel:|mailto:|\/contact)/.test(shown.href), `CTA is an AI-derived action: href="${shown.href}" label="${shown.label}"`);
  add(shown.focused, `primary action receives focus on open (a11y)`);

  // 4. Esc closes it (never traps).
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const afterEsc = await page.locator('[data-testid="exit-intent-offer"]').count();
  add(afterEsc === 0, `Esc closes the card: count=${afterEsc} (want 0)`);

  // 5. SESSION-ONCE: a second exit signal must NOT reopen it (no nag).
  await page.evaluate(fireExitSignal);
  await page.waitForTimeout(300);
  const reopened = await page.locator('[data-testid="exit-intent-offer"]').count();
  add(reopened === 0, `session-once: a second exit signal does NOT reopen: count=${reopened} (want 0)`);

  add(errs.length === 0, `0 console errors: ${errs.slice(0, 2).join(' | ') || 'clean'}`);

  await browser.close();
  const allOk = rows.every(([ok]) => ok);
  console.log('\n━━ Exit-Intent Recovery (exit_intent) ━━');
  rows.forEach(([ok, msg]) => console.log(`  ${ok ? '✓' : '❌'} ${msg}`));
  console.log(
    allOk
      ? '\n✅ PASS — LCP-safe until the exit signal, opens with an AI-derived action, Esc-closable, session-once, 0 console errors.'
      : '\n🔴 CHECK — see failures above.',
  );
  exitCode = allOk ? 0 : 1;
} catch (e) {
  console.log(`  ❌ probe error: ${String(e.message || e).slice(0, 140)}`);
  exitCode = 1;
} finally {
  preview.kill('SIGTERM');
}
process.exit(exitCode);
