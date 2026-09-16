/**
 * Durable gate: every Cloudflare Workers AI **Llama** model alias used in CODE (not comments)
 * across `functions/` + `src/` must be a REAL alias on the allowlist.
 *
 * Why this exists: the concierge (`functions/api/ai/chat.ts`) shipped `@cf/meta/llama-3.3-8b-
 * instruct-fp8-fast` as its default — a NONEXISTENT alias (Llama 3.3 is 70B-only; the 8B is
 * Llama 3.1). `env.AI.run` threw on it, so EVERY concierge call 502'd in production (proven live
 * 2026-09-16). This test fails the build on any invalid `@cf/meta/llama-*` literal so a made-up
 * alias can never ship again.
 *
 * Comment-stripped (validator-precision): the fix's own explanatory comments legitimately NAME the
 * dead alias; scanning raw text would false-flag them. We scan only comment-free code, and a
 * synthetic self-check proves the detector actually catches an invalid alias (never vacuous).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

// Valid CF Workers AI Llama aliases (fp8 variants; the full-precision + made-up ones are retired
// or nonexistent). Keep in sync with the global model-routing rule.
const VALID_LLAMA = new Set([
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
  '@cf/meta/llama-4-scout-17b-16e-instruct',
]);

/** Strip `//` line + `/* *\/` block comments while preserving string contents + newlines. */
function stripComments(src: string): string {
  let out = '';
  let i = 0;
  let str: string | null = null; // active quote char
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (str) {
      out += c;
      if (c === '\\') { out += n ?? ''; i += 2; continue; }
      if (c === str) str = null;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { str = c; out += c; i += 1; continue; }
    if (c === '/' && n === '/') { while (i < src.length && src[i] !== '\n') i += 1; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i += 1; i += 2; continue; }
    out += c;
    i += 1;
  }
  return out;
}

/** All `@cf/meta/llama-*` aliases in comment-free CODE. */
function llamaAliases(src: string): string[] {
  return [...stripComments(src).matchAll(/@cf\/meta\/llama-[a-z0-9.-]+/gi)].map((m) => m[0]);
}

function walk(dir: string): string[] {
  const files: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return files; }
  for (const e of entries) {
    if (e === 'node_modules' || e === 'dist' || e === '.git' || e === 'worktrees' || e === '.claude') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else if (/\.(ts|tsx|mjs)$/.test(e) && !/\.test\.|\.spec\./.test(e)) files.push(p);
  }
  return files;
}

describe('CF Workers AI model-alias validity gate', () => {
  it('detector catches a nonexistent alias (not vacuous)', () => {
    const bad = "const M = '@cf/meta/llama-3.3-8b-instruct-fp8-fast'; // NOPE";
    const found = llamaAliases(bad);
    expect(found).toContain('@cf/meta/llama-3.3-8b-instruct-fp8-fast');
    expect(VALID_LLAMA.has(found[0])).toBe(false);
  });

  it('ignores an alias that appears ONLY in a comment (validator-precision)', () => {
    const src = "// old default @cf/meta/llama-3.3-8b-instruct-fp8-fast was wrong\nconst M = '@cf/meta/llama-3.1-8b-instruct-fp8';";
    expect(llamaAliases(src)).toEqual(['@cf/meta/llama-3.1-8b-instruct-fp8']);
  });

  it('every Llama alias in functions/ + src/ CODE is a real, valid alias', () => {
    const root = join(__dirname, '..');
    const offenders: string[] = [];
    for (const f of [...walk(join(root, 'functions')), ...walk(join(root, 'src'))]) {
      for (const alias of llamaAliases(readFileSync(f, 'utf-8'))) {
        if (!VALID_LLAMA.has(alias)) offenders.push(`${f.replace(root + '/', '')}: ${alias}`);
      }
    }
    expect(offenders, `Invalid CF Llama alias(es):\n${offenders.join('\n')}`).toEqual([]);
  });
});
