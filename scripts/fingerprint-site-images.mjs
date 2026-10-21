#!/usr/bin/env node
/**
 * Adds ?v=<hash of the picture> to every /images/… picture in the website's hand-written pages, so a changed
 * picture gets a new address and no browser keeps showing the old one. Part of `npm run site`.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = process.env.SITE_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '../site');
if (!existsSync(SITE)) process.exit(0);
for (const page of ['index.html', 'authors/index.html']) {
  const file = join(SITE, page);
  const html = readFileSync(file, 'utf8').replace(/src="(\/images\/[^"?]+\.(?:webp|png|jpg|svg))(?:\?v=[0-9a-f]+)?"/g, (_, path) =>
    `src="${path}?v=${createHash('sha256').update(readFileSync(join(SITE, path))).digest('hex').slice(0, 8)}"`);
  writeFileSync(file, html);
}
console.log('site: pictures fingerprinted');
