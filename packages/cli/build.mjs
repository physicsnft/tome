/**
 * Build the publishable CLI: one bundled entry point, plus the player's production build for `tome preview`.
 *
 * Everything is bundled except the handful of packages that are better left to npm: Pyodide (14 MB, served
 * from node_modules at preview time) and smiles-drawer (loaded lazily, and large).
 */
import { build } from 'esbuild';
import { cpSync, rmSync, mkdirSync, existsSync, writeFileSync, statSync, readdirSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const playerDist = join(here, '../player-web/dist');

rmSync(join(here, 'dist'), { recursive: true, force: true });
rmSync(join(here, 'player'), { recursive: true, force: true });

await build({
  entryPoints: [join(here, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: join(here, 'dist/index.js'),
  // Some dependencies are CommonJS and call require() at load time; ESM output needs these shims.
  banner: { js: [
    '#!/usr/bin/env node',
    "import { createRequire as __createRequire } from 'node:module';",
    "import { fileURLToPath as __fileURLToPath } from 'node:url';",
    "import { dirname as __pathDirname } from 'node:path';",
    'const require = __createRequire(import.meta.url);',
    'const __filename = __fileURLToPath(import.meta.url);',
    'const __dirname = __pathDirname(__filename);',
  ].join('\n') },
  external: ['pyodide', 'smiles-drawer'],
  loader: { '.json': 'json' },
  logLevel: 'info',
});

// npm sets the executable bit when installing from a tarball, but a workspace checkout links straight at
// this file — without the bit, `npx tome` fails with "Permission denied".
chmodSync(join(here, 'dist/index.js'), 0o755);

if (!existsSync(join(playerDist, 'index.html'))) {
  console.error('\nThe player is not built. Run:  npm run build -w @tome/player-web');
  process.exit(1);
}
// Copy the player, minus Pyodide: it is a dependency, served from node_modules by `tome preview`.
cpSync(playerDist, join(here, 'player'), { recursive: true, filter: (src) => !src.includes(`${'/'}pyodide${'/'}`) && !src.endsWith('/pyodide') });
// Sample content is not part of the tool.
for (const d of ['courses', 'bundles']) rmSync(join(here, 'player', d), { recursive: true, force: true });
mkdirSync(join(here, 'player/courses'), { recursive: true });
writeFileSync(join(here, 'player/courses/index.json'), '[]');

function size(p) {
  let total = 0;
  const walk = (x) => { const s = statSync(x); if (s.isDirectory()) readdirSync(x).forEach((c) => walk(join(x, c))); else total += s.size; };
  walk(p);
  return (total / 1e6).toFixed(1) + ' MB';
}
console.log(`\nplayer: ${size(join(here, 'player'))}   cli: ${size(join(here, 'dist'))}`);
