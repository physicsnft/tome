#!/usr/bin/env node
// Starts the built tool. This file is always in the repository, so `npm install` can always create the `tome`
// command, even before the tool has been built; dist/ is made by `npm run build:cli`.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const built = fileURLToPath(new URL('../dist/index.js', import.meta.url));
if (!existsSync(built)) {
  console.error('The tome tool is not built yet. In the repository folder, run: npm run build:cli');
  process.exit(1);
}
await import(new URL('../dist/index.js', import.meta.url).href);
