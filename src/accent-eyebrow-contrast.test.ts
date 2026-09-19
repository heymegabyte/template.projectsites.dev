import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Accent-eyebrow contrast guard (the `generated-site-accent-text-contrast` class, caught LIVE on
 * katzs-delicatessen's contact eyebrow: axe color-contrast SERIOUS ×7 on a light-theme site).
 *
 * The template exposes a contrast-safe accent for TEXT via `--color-accent-readable`
 * (`oklch(from var(--color-accent) 0.38 c h)` on light/auto themes — dark enough to clear 4.5:1),
 * and the `.text-accent` UTILITY class is remapped to it under `[data-theme='light'|'auto']`. An
 * eyebrow/label that colors its TEXT with the RAW arbitrary value `text-[var(--color-accent)]`
 * BYPASSES that remap → it renders the bright raw accent on a light surface → a real WCAG AA
 * failure axe flags as SERIOUS. Eyebrow/label text MUST use `text-accent` (no-op on dark, readable
 * on light). This scans the source so the whole class stays fixed, not just the one Contact eyebrow.
 */
const ROOT = join(import.meta.dirname ?? __dirname);
const TSX_DIRS = ['pages', 'components'];

/** Recursively collect every .tsx under the given src subdirectories. */
function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...tsxFiles(p));
    else if (e.endsWith('.tsx') && !e.endsWith('.test.tsx') && !e.endsWith('.stories.tsx')) out.push(p);
  }
  return out;
}

// A raw-accent color paired (either class order) with the eyebrow/label signature (font-mono +
// tracking-widest) — the exact shape that fails contrast on light themes.
const RAW_ACCENT = 'text-[var(--color-accent)]';
const isRawAccentEyebrow = (cls: string): boolean =>
  cls.includes(RAW_ACCENT) && /font-mono/.test(cls) && /tracking-widest/.test(cls);

describe('accent eyebrow/label contrast — no raw text-[var(--color-accent)] on eyebrow text', () => {
  it('every eyebrow/label uses the readable-remapped `text-accent`, never the raw accent var', () => {
    const offenders: string[] = [];
    for (const dir of TSX_DIRS) {
      for (const file of tsxFiles(join(ROOT, dir))) {
        const src = readFileSync(file, 'utf8');
        // Inspect each className string; flag any eyebrow-shaped one still on the raw accent var.
        for (const m of src.matchAll(/className=(?:"([^"]*)"|`([^`]*)`|'([^']*)')/g)) {
          const cls = m[1] ?? m[2] ?? m[3] ?? '';
          if (isRawAccentEyebrow(cls)) offenders.push(`${file.replace(ROOT, 'src')}: ${cls.slice(0, 80)}`);
        }
      }
    }
    expect(offenders, `raw-accent eyebrows bypass the AA-safe remap:\n${offenders.join('\n')}`).toEqual([]);
  });
});
