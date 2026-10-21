import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const PYODIDE_FILES = ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

/** Copy the Pyodide runtime into the build so the Python sandbox works offline (no CDN). */
function bundlePyodide() {
  const src = dirname(require.resolve('pyodide/package.json'));
  return {
    name: 'bundle-pyodide',
    configureServer(server: any) { server.middlewares.use('/pyodide', (req: any, res: any, next: any) => { const f = PYODIDE_FILES.find((n) => req.url === '/' + n); if (!f) return next(); res.setHeader('Content-Type', f.endsWith('.wasm') ? 'application/wasm' : f.endsWith('.mjs') || f.endsWith('.js') ? 'text/javascript' : 'application/octet-stream'); require('node:fs').createReadStream(join(src, f)).pipe(res); }); },
    writeBundle(opts: any) { const out = join(opts.dir ?? 'dist', 'pyodide'); mkdirSync(out, { recursive: true }); for (const f of PYODIDE_FILES) copyFileSync(join(src, f), join(out, f)); },
  };
}

/**
 * Offline web app: writes dist/sw.js after the build. The app shell (HTML, scripts, styles, woff2 fonts, keys,
 * catalog, icons) is cached on install, so Tome starts with no network. Larger things that only some lessons
 * need — the Python runtime, the piano samples — are cached the first time they are used. Each build gets its
 * own cache name, and the previous one is removed once the new worker takes over.
 */
function offlineWorker() {
  return {
    name: 'offline-worker',
    apply: 'build' as const,
    writeBundle(opts: any, bundle: Record<string, unknown>) {
      const dir = opts.dir ?? 'dist';
      const fs = require('node:fs') as typeof import('node:fs');
      const fromBuild = Object.keys(bundle).filter((f) => /\.(js|css|woff2)$/.test(f) && !f.includes('pyodide'));
      const fromPublic = ['index.html', 'trusted-keys.json', 'catalog.json', 'manifest.webmanifest', 'favicon.svg', 'favicon.ico',
        ...fs.readdirSync(join(dir, 'icons')).map((f) => `icons/${f}`)];
      const shell = ['/', ...[...fromPublic, ...fromBuild].map((f) => '/' + f)];
      const version = require('node:crypto').createHash('sha256').update(shell.join('|') + fs.readFileSync(join(dir, 'index.html'))).digest('hex').slice(0, 12);
      const src = fs.readFileSync(new URL('./src/sw.template.js', import.meta.url), 'utf8')
        .replace('__VERSION__', version).replace('__SHELL__', JSON.stringify(shell));
      fs.writeFileSync(join(dir, 'sw.js'), src);
    },
  };
}

export default defineConfig({
  plugins: [react(), bundlePyodide(), offlineWorker()],
  // remark-math only needs the syntax half of micromark-extension-math; the html half statically imports KaTeX
  // (260 kB) and would drag it into the initial bundle. Point the package at the syntax entry.
  resolve: { alias: { 'micromark-extension-math': join(dirname(require.resolve('micromark-extension-math')), 'lib/syntax.js') } },
  server: { fs: { allow: ['..'] } },
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: { output: { manualChunks(id) {
      // Split the big third-party libraries so they cache independently and only load when a lesson needs them.
      if (id.includes('@codemirror') || id.includes('@lezer')) return 'codemirror';
      if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react';
      if (id.includes('node_modules/katex')) return undefined; // dynamic-only: let Rollup split it
      if (id.includes('node_modules')) return 'vendor';
    } } },
  },
});
