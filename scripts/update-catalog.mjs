#!/usr/bin/env node
/**
 * Fills in what packages/player-web/public/catalog.json says about each course, from the course itself:
 *   version, changelog — from the course's manifest, so the app can offer "Update available"
 *   authors, tags, description, level, minutes — what the store searches and filters by
 *   bundleUrl, sizeBytes — the newest signed bundle of that course in public/bundles
 *   cover — with ?v=<hash of the picture>, so a new cover is never hidden by a cached old one
 * Titles, prices and the order of courses stay as you wrote them.
 *
 *   node scripts/update-catalog.mjs        (sign-store runs it for you)
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'packages/player-web/public');

const semverParts = (v) => v.split(/[.+-]/).slice(0, 3).map((n) => parseInt(n, 10) || 0);
const newer = (a, b) => { const x = semverParts(a), y = semverParts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };

export function updateCatalog() {
  const path = join(PUB, 'catalog.json');
  const catalog = JSON.parse(readFileSync(path, 'utf8'));
  for (const entry of catalog) {
    const dir = join(PUB, 'courses', entry.dir);
    const manifest = JSON.parse(readFileSync(join(dir, existsSync(join(dir, 'manifest.json')) ? 'manifest.json' : 'manifest.json.in'), 'utf8'));
    entry.version = manifest.version;
    // What the store searches and filters by. The first tag is the course's subject.
    entry.authors = manifest.authors.map((a) => a.name);
    entry.tags = manifest.tags ?? [];
    entry.description = manifest.description;
    if (manifest.level) entry.level = manifest.level; else delete entry.level;
    entry.minutes = manifest.estimatedMinutes;
    if (manifest.changelog) entry.changelog = manifest.changelog; else delete entry.changelog;

    const bundles = readdirSync(join(PUB, 'bundles')).filter((f) => f.startsWith(entry.courseId + '-') && f.endsWith('.course'));
    const best = bundles.sort((a, b) => (newer(a.slice(entry.courseId.length + 1, -7), b.slice(entry.courseId.length + 1, -7)) ? -1 : 1))[0];
    if (!best) throw new Error(`No bundle for ${entry.courseId} in public/bundles`);
    if (best !== `${entry.courseId}-${manifest.version}.course`) console.warn(`Warning: ${entry.courseId} is version ${manifest.version} in its folder, but the newest bundle is ${best}. Run sign-store.`);
    entry.bundleUrl = `/bundles/${best}`;
    entry.sizeBytes = statSync(join(PUB, 'bundles', best)).size;

    const coverPath = `/courses/${entry.dir}/${manifest.cover}`;
    const hash = createHash('sha256').update(readFileSync(join(PUB, coverPath))).digest('hex').slice(0, 8);
    entry.cover = `${coverPath}?v=${hash}`;
  }
  writeFileSync(path, JSON.stringify(catalog, null, 2) + '\n');
  return catalog;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const c = updateCatalog();
  for (const e of c) console.log(`${e.title}: ${e.version} · ${e.bundleUrl}`);
}
