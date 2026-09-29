#!/usr/bin/env node
/**
 * validate-catalog.mjs — drift gate for catalog/components.json.
 *
 * Fails (exit 1) when:
 *   1. a component under src/components/sections/ has NO catalog entry,
 *   2. an entry's `component` path does not exist on disk,
 *   3. an entry's `requiredFacts` is not an array of strings,
 *   4. ids/paths are duplicated, or an entry is missing a core typed field.
 *
 * Run: `npm run validate:catalog` (part of validate:all). Add the catalog entry
 * in the SAME commit that adds/renames a section component. See catalog/README.md.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = join(root, 'catalog', 'components.json');
const sectionsDir = join(root, 'src', 'components', 'sections');
const errors = [];

let catalog;
try {
  catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
} catch (err) {
  console.error(`✖ cannot read/parse ${catalogPath}: ${err.message}`);
  process.exit(1);
}
const entries = Array.isArray(catalog.components) ? catalog.components : [];
if (entries.length === 0) errors.push('catalog has no components[] entries');
if (!catalog.rules?.provenance) errors.push('catalog.rules.provenance is missing');

// 1. Every sections/ component (non-test, non-stories) has an entry.
const files = readdirSync(sectionsDir).filter(
  (f) => f.endsWith('.tsx') && !/\.(test|stories)\.tsx$/.test(f),
);
const covered = new Set(entries.map((e) => e.component));
for (const f of files) {
  const rel = `src/components/sections/${f}`;
  if (!covered.has(rel)) errors.push(`no catalog entry for ${rel}`);
}

// 2-4. Every entry is well-formed and points at a real file.
const MOTION = new Set(['none', 'css', 'scroll-driven', 'webgl']);
const seenIds = new Set();
const seenPaths = new Set();
for (const e of entries) {
  const tag = e.id ?? e.component ?? '<unnamed entry>';
  if (!e.id) errors.push(`${tag}: missing id`);
  else if (seenIds.has(e.id)) errors.push(`duplicate id "${e.id}"`);
  else seenIds.add(e.id);
  if (!e.component || !existsSync(join(root, e.component)))
    errors.push(`${tag}: component path missing on disk: ${e.component}`);
  else if (seenPaths.has(e.component)) errors.push(`${tag}: duplicate component path`);
  else seenPaths.add(e.component);
  if (!Array.isArray(e.requiredFacts) || e.requiredFacts.some((x) => typeof x !== 'string'))
    errors.push(`${tag}: requiredFacts must be an array of strings`);
  if (!e.scenario) errors.push(`${tag}: missing scenario`);
  if (!Array.isArray(e.editingControls)) errors.push(`${tag}: editingControls must be an array`);
  if (!e.semanticFallback) errors.push(`${tag}: missing semanticFallback`);
  if (!MOTION.has(e.motion?.type)) errors.push(`${tag}: motion.type must be none|css|scroll-driven|webgl`);
  if (!e.motion?.reducedMotion) errors.push(`${tag}: missing motion.reducedMotion note`);
  if (!Array.isArray(e.browserApis)) errors.push(`${tag}: browserApis must be an array`);
  if (!e.a11yNotes) errors.push(`${tag}: missing a11yNotes`);
  if (typeof e.budget?.maxKbJs !== 'number' || typeof e.budget?.maxKbImg !== 'number')
    errors.push(`${tag}: budget.maxKbJs/maxKbImg must be numbers`);
  for (const t of Array.isArray(e.tests) ? e.tests : (errors.push(`${tag}: tests must be an array`), []))
    if (!existsSync(join(root, t))) errors.push(`${tag}: test path missing on disk: ${t}`);
}

if (errors.length) {
  console.error(`✖ catalog drift — ${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ catalog OK — ${entries.length} entries cover ${files.length} section components`);
