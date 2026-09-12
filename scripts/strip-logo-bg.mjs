#!/usr/bin/env node
/**
 * strip-logo-bg.mjs — make the navbar logo + wordmark TRANSPARENT (Brian directive 2026-09-08).
 *
 * The container generates the brand icon (public/apple-touch-icon.png) and wordmark
 * (public/logo-wordmark.png) with Ideogram, which bakes a SOLID background into the PNG
 * (colorType 2, no alpha) — so a delivered site shows the logo inside an opaque rectangle.
 * apple-touch-icon MUST stay opaque (iOS flattens transparent app-icons to black), so we do
 * NOT touch it; instead we produce a NEW transparent `public/logo-icon.png` (which Header.tsx
 * prefers) and strip `public/logo-wordmark.png` in place.
 *
 * Method (no external service / key — sharp is already a dep): decode → detect a near-uniform
 * solid background from the 4 corners → flood-fill from every edge pixel, turning contiguous
 * near-background pixels transparent (interior logo pixels are enclosed, so they survive) →
 * re-encode as RGBA PNG.
 *
 * SAFE BY CONSTRUCTION — never breaks a build:
 *   - Fully fail-soft: any error (sharp unavailable in-container, odd PNG, missing file) →
 *     log + skip that asset, ALWAYS exit 0.
 *   - Only strips when the corners are a genuine near-uniform solid bg (else the logo may be a
 *     photo / already-transparent — skip, don't damage it).
 *   - Refuses a result that erased the whole mark (>99.4% transparent) — keeps the original.
 *
 * Usage: node scripts/strip-logo-bg.mjs   (LOGO_DIR=… to point at another public dir)
 */
import { existsSync, statSync, copyFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = process.env.LOGO_DIR || resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TH = 42; // per-channel-avg color distance treated as "same as background"

/** Load sharp lazily so a missing native binary degrades to skip-all, never a build failure. */
async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch (e) {
    console.warn(`[strip-logo-bg] sharp unavailable → skipping (${String(e).slice(0, 60)})`);
    return null;
  }
}

/**
 * Strip a near-uniform solid background to transparency via edge flood-fill.
 * @returns 'stripped' | 'already-transparent' | 'no-solid-bg' | 'too-aggressive' | 'error'
 */
async function stripBg(sharp, srcPath, destPath) {
  try {
    const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width;
    const H = info.height;
    const at = (x, y) => (y * W + x) * 4;
    const cornerPts = [
      [0, 0],
      [W - 1, 0],
      [0, H - 1],
      [W - 1, H - 1],
    ];
    const corners = cornerPts.map(([x, y]) => {
      const i = at(x, y);
      return [data[i], data[i + 1], data[i + 2], data[i + 3]];
    });

    // Already transparent at the corners → nothing to strip; just publish a copy.
    if (corners.every((c) => c[3] < 12)) {
      copyFileSync(srcPath, destPath);
      return 'already-transparent';
    }

    // Corners must agree (a real solid bg). Wildly different corners = photo/gradient → skip.
    const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    const maxCornerSpread = Math.max(...corners.flatMap((a) => corners.map((b) => dist(a, b))));
    if (maxCornerSpread > TH * 3) {
      return 'no-solid-bg';
    }

    const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((s, k) => s + k[c], 0) / 4));
    const near = (i) =>
      Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) <= TH * 3;

    const seen = new Uint8Array(W * H);
    const stack = [];
    for (let x = 0; x < W; x++) {
      stack.push(x, 0, x, H - 1);
    }
    for (let y = 0; y < H; y++) {
      stack.push(0, y, W - 1, y);
    }
    let stripped = 0;
    while (stack.length) {
      const y = stack.pop();
      const x = stack.pop();
      if (x < 0 || y < 0 || x >= W || y >= H) {
        continue;
      }
      const p = y * W + x;
      if (seen[p]) {
        continue;
      }
      seen[p] = 1;
      const i = p * 4;
      if (!near(i)) {
        continue;
      }
      data[i + 3] = 0;
      stripped++;
      stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
    }

    // Guard: if we erased essentially everything, the "logo" was all background → keep original.
    if (stripped / (W * H) > 0.994) {
      return 'too-aggressive';
    }

    await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toFile(destPath);
    return 'stripped';
  } catch (e) {
    console.warn(`[strip-logo-bg] ${srcPath} → error, skipping (${String(e).slice(0, 60)})`);
    return 'error';
  }
}

/**
 * Crop the transparent/near-solid margins off the wordmark so its text FILLS the image.
 * A generated wordmark is often a padded near-square canvas (cafe-dim-sum shipped a
 * 1312×736 wordmark whose "Cafe Dim Sum" text rendered a tiny 71×40 once the Header
 * height-constrained it — AL-392). Trimming to the ink turns it into a tight horizontal
 * wordmark that renders large + legible at any height. Fail-soft + guarded: any error, or
 * a trim that erased almost everything, keeps the untrimmed file.
 */
async function trimWordmark(sharp, path) {
  try {
    const src = await sharp(path).metadata();
    const trimmed = await sharp(path).trim({ threshold: 12 }).png().toBuffer();
    const out = await sharp(trimmed).metadata();
    const okSize = (out.width ?? 0) >= 24 && (out.height ?? 0) >= 12;
    // Guard against an over-aggressive trim (bad alpha detection) collapsing it to a sliver.
    const shrankTooFar =
      (out.width ?? 0) < (src.width ?? 1) * 0.05 || (out.height ?? 0) < (src.height ?? 1) * 0.05;
    if (okSize && !shrankTooFar) {
      await sharp(trimmed).toFile(path);
      console.warn(
        `[strip-logo-bg] logo-wordmark.png trimmed ${src.width}×${src.height} → ${out.width}×${out.height}`,
      );
    } else {
      console.warn('[strip-logo-bg] wordmark trim skipped (too aggressive) → kept untrimmed');
    }
  } catch (e) {
    console.warn(`[strip-logo-bg] wordmark trim failed (${String(e).slice(0, 50)}) → kept untrimmed`);
  }
}

const sharp = await loadSharp();
if (!sharp) {
  process.exit(0);
}

const apple = resolve(DIR, 'apple-touch-icon.png');
const wordmark = resolve(DIR, 'logo-wordmark.png');
const iconOut = resolve(DIR, 'logo-icon.png');

// Icon: produce a NEW transparent logo-icon.png (leave apple-touch-icon opaque for iOS).
// Skip the tiny deterministic monogram (<2 KB) — it is already a clean small mark.
if (existsSync(apple) && statSync(apple).size > 2000) {
  const r = await stripBg(sharp, apple, iconOut);
  console.warn(`[strip-logo-bg] apple-touch-icon → logo-icon.png: ${r}`);
  // ALWAYS emit logo-icon.png (AL-386). stripBg only WRITES iconOut on 'stripped' /
  // 'already-transparent'; on 'no-solid-bg' (photo/gradient logo or disagreeing corners),
  // 'too-aggressive', or 'error' it returns WITHOUT writing → Header.tsx's primary
  // `/logo-icon.png` ref 404s on EVERY such delivered site (a real console error confirmed
  // live on Tartine/Kabuki/Spa Radiance). Fall back to the opaque apple-touch so the mark is
  // PRESENT (no 404) — same visual as the old onError→apple-touch chain, minus the console
  // error; the transparent strip stays preferred whenever it succeeds.
  if (!existsSync(iconOut)) {
    try {
      copyFileSync(apple, iconOut);
      console.warn('[strip-logo-bg] logo-icon.png absent after strip → copied apple-touch (no-404 fallback)');
    } catch (e) {
      console.warn(`[strip-logo-bg] logo-icon fallback copy failed (${String(e).slice(0, 50)})`);
    }
  }
} else {
  console.warn('[strip-logo-bg] no real apple-touch-icon (or monogram) → no logo-icon.png');
}

// Wordmark: strip bg → transparent, THEN trim the padding so the text FILLS the image
// (a padded near-square wordmark renders as tiny illegible text once the Header
// height-constrains it — AL-392). Trim → tight horizontal wordmark → large + legible.
if (existsSync(wordmark) && statSync(wordmark).size > 2000) {
  const r = await stripBg(sharp, wordmark, wordmark);
  console.warn(`[strip-logo-bg] logo-wordmark.png (in place): ${r}`);
  await trimWordmark(sharp, wordmark);
}

process.exit(0);
