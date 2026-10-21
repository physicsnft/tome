#!/usr/bin/env node
/**
 * Re-sign every store course with YOUR platform key, and make the app trust that key and no other.
 *
 *   npm run build:cli                                  # once, so the tome command exists
 *   npx tome keygen keys/platform-2026.json tome-platform-2026   # once; keep this file safe, never commit it
 *   npm run sign-store -- keys/platform-2026.json
 *
 * For each course in packages/player-web/public/catalog.json it builds the course from
 * packages/player-web/public/courses/<dir>, signs it, checks it, and replaces the bundle in public/bundles.
 * Then it writes only your key into public/trusted-keys.json and updates the catalog's file names and sizes.
 * Afterwards rebuild the app (see packages/player-web/ANDROID.md, or the publishing manual) and upload it again.
 */
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdtempSync, copyFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { updateCatalog } from './update-catalog.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'packages/player-web/public');
const CLI = join(ROOT, 'packages/cli/dist/index.js');
const keyPath = process.argv[2];

const fail = (msg) => { console.error(msg); process.exit(1); };
if (!keyPath) fail('Usage: npm run sign-store -- <your-platform-key.json>');
if (!existsSync(keyPath)) fail(`No key file at ${keyPath}. Create one with: npx tome keygen ${keyPath} tome-platform-2026`);
if (!existsSync(CLI)) fail('The tome command is not built yet. Run: npm run build:cli');
const key = JSON.parse(readFileSync(keyPath, 'utf8'));
if (!key.keyId || !key.publicKey || !key.privateKey) fail(`${keyPath} is not a key made by tome keygen.`);
if (key.keyId.startsWith('author-')) fail(`${key.keyId} is an author key. Make a platform key with a name of your own: npx tome keygen ${keyPath} tome-platform-2026`);
if (key.keyId.startsWith('dev-')) console.warn(`Warning: ${key.keyId} looks like a development key.`);

const tome = (...args) => execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });

// Trust your key, and only yours, before verifying with it.
writeFileSync(join(PUB, 'trusted-keys.json'), JSON.stringify([{ keyId: key.keyId, publicKey: key.publicKey }], null, 2) + '\n');

const catalog = JSON.parse(readFileSync(join(PUB, 'catalog.json'), 'utf8'));
const tmp = mkdtempSync(join(tmpdir(), 'tome-sign-'));
try {
  for (const entry of catalog) {
    const src = join(PUB, 'courses', entry.dir);
    const out = join(tmp, entry.dir);
    tome('build', src, '--out', out);
    const file = readdirSync(out).find((f) => f.endsWith('.course'));
    if (!file) fail(`tome build made no .course file for ${entry.dir}`);
    tome('sign', join(out, file), keyPath);
    const report = tome('verify', join(out, file), join(PUB, 'trusted-keys.json'));
    if (!/trusted/.test(report) || /mismatch|untrusted|unknown/i.test(report)) fail(`${file} did not verify:\n${report}`);
    // Replace this course's old bundles (any version) with the new one.
    for (const old of readdirSync(join(PUB, 'bundles'))) if (old.startsWith(entry.courseId + '-') && old.endsWith('.course')) rmSync(join(PUB, 'bundles', old));
    copyFileSync(join(out, file), join(PUB, 'bundles', file));
    entry.bundleUrl = `/bundles/${file}`;
    entry.sizeBytes = statSync(join(PUB, 'bundles', file)).size;
    console.log(`signed ${file} with ${key.keyId}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
writeFileSync(join(PUB, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
updateCatalog(); // versions, notes and cover fingerprints, from each course
console.log(`\nDone: ${catalog.length} courses signed, and the app now trusts only ${key.keyId}.`);
console.log('Next: npm run build:app-preview, then upload packages/player-web/dist again.');
