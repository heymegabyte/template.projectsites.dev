import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Regression gate (CODE-QUALITY SWEEP): the AiChat textarea's Enter-to-send must fire the
 * form's NATIVE submit (a real SubmitEvent) — never fabricate a FormEvent by casting a
 * KeyboardEvent (`onSubmit(e as unknown as FormEvent)`, a TS-strict smell that also skips
 * native constraint validation). Source-based (matches this repo's WebGLHeroBackdrop /
 * section-img gate idiom) — precise, no false positives.
 */
const src = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'AiChat.tsx'), 'utf8');

describe('AiChat Enter-to-send', () => {
  it('fires the form’s native requestSubmit() on Enter (real SubmitEvent)', () => {
    expect(src).toMatch(/\.form\?\.requestSubmit\(\)/);
  });

  it('never fabricates a FormEvent from a KeyboardEvent (no `as unknown as FormEvent`)', () => {
    expect(src).not.toContain('as unknown as FormEvent');
  });
});
