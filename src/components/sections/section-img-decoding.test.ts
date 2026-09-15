import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Perf gate (CODE-QUALITY SWEEP Fire 2): every below-the-fold section `<img>` must set
 * `decoding="async"` so image decode never blocks the main thread (an INP/CWV win on every
 * generated site — 12 sections were missing it after Fire 1 added it to only Menu/FeaturedCollection).
 *
 * HeroVariants is EXEMPT: it renders the LCP hero image, where async decode can DELAY the largest
 * paint — the LCP img wants eager fetch + a synchronous/normal decode (per ttfr-north-star). So the
 * hero is intentionally excluded, and this gate keeps every OTHER section image async-decoded.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const EXEMPT = new Set(['HeroVariants.tsx']); // LCP hero — async decode can hurt LCP

/** Strip JSDoc/line/HTML comment lines so a `<img>` MENTIONED in prose isn't mistaken for a tag. */
function stripComments(src: string): string {
  return src
    .split('\n')
    .filter((l) => {
      const t = l.trim();
      return !(t.startsWith('*') || t.startsWith('//') || t.startsWith('/*') || t.startsWith('<!--'));
    })
    .join('\n');
}

const files = readdirSync(__dirname).filter(
  (f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx') && !f.endsWith('.stories.tsx') && !EXEMPT.has(f),
);

describe('section <img> decoding="async" perf gate', () => {
  for (const f of files) {
    const src = stripComments(readFileSync(resolve(__dirname, f), 'utf8'));
    // Real self-closing JSX img tags (a tag carries a `src=`; a bare mention does not).
    const tags = [...src.matchAll(/<img\b[\s\S]*?\/>/g)].map((m) => m[0]).filter((t) => /\bsrc=/.test(t));
    if (tags.length === 0) continue;
    it(`${f}: every <img> sets decoding="async"`, () => {
      for (const tag of tags) {
        expect(tag, `<img> in ${f} missing decoding="async": ${tag.slice(0, 80)}…`).toMatch(
          /decoding=["']async["']/,
        );
      }
    });
  }
});
