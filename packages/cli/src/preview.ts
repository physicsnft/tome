/**
 * `tome preview <course-dir>` — serve the player with one course loaded, and reload it on save.
 *
 * Before this, previewing meant copying a folder into the player's `public/courses/` and hand-editing
 * `index.json` — the clumsiest step in authoring, and the one most likely to make a first-time author
 * give up before seeing their own lesson render.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync, mkdirSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { findCourseRoot } from './courseroot.ts';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseLesson, validateManifest, manifestLessons, unpackBundle, verifyBundle, verifyAuthorSignature, type Manifest, type TrustedKey } from '@tome/core';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4', '.wasm': 'application/wasm', '.zip': 'application/zip', '.woff2': 'font/woff2', '.md': 'text/markdown',
};
const mime = (p: string) => MIME[extname(p).toLowerCase()] ?? 'application/octet-stream';

const walk = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])) : [];

/** Newest mtime in the course, used as a cheap change token for live reload. */
const stamp = (root: string) => Math.max(0, ...walk(root).map((f) => statSync(f).mtimeMs));

/** The manifest the player receives: the author's `.in` file with contentHashes filled in, as `build` would. */
function liveManifest(root: string): Manifest {
  const p = existsSync(join(root, 'manifest.json.in')) ? 'manifest.json.in' : 'manifest.json';
  const m: Manifest = JSON.parse(readFileSync(join(root, p), 'utf8'));
  const files = walk(root).map((f) => relative(root, f).replaceAll('\\', '/'))
    .filter((f) => !['manifest.json', 'manifest.json.in', 'signature.json', 'README.md'].includes(f) && !f.startsWith('dist/'));
  m.contentHashes = Object.fromEntries(files.sort().map((f) => [f, 'sha256:' + createHash('sha256').update(readFileSync(join(root, f))).digest('hex')]));
  return m;
}

/** A quick check on every save: enough to catch the mistakes that make a lesson vanish. */
function report(root: string) {
  const problems: string[] = [];
  let manifest: Manifest | null = null;
  try { manifest = liveManifest(root); } catch (e) { problems.push(`manifest: ${(e as Error).message}`); }
  if (manifest) {
    problems.push(...validateManifest(manifest).map((m) => `manifest: ${m}`));
    for (const l of manifestLessons(manifest)) {
      const file = join(root, l);
      if (!existsSync(file)) { problems.push(`${l}: missing`); continue; }
      for (const p of parseLesson(l, readFileSync(file, 'utf8')).problems) {
        if (p.level === 'error') problems.push(`${l}${p.line ? `:${p.line}` : ''} ${p.message}`);
      }
    }
  }
  const when = new Date().toLocaleTimeString();
  if (problems.length) {
    console.log(`\n[${when}] ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
    for (const p of problems.slice(0, 12)) console.log(`  ${p}`);
    if (problems.length > 12) console.log(`  …and ${problems.length - 12} more — run \`tome validate\` for the full list`);
  } else {
    console.log(`[${when}] ok — ${manifest?.structure?.flatMap((c) => c.lessons).length ?? 0} lessons`);
  }
  return problems;
}

/** Injected into the player: polls for a change token and reloads. Nothing ships with this. */
const RELOAD = `<script>
// Previews must always show the files on disk: no offline cache, and drop any left from an earlier session.
window.__TOME_PREVIEW__ = true;
navigator.serviceWorker && navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
(async () => {
  let last = null;
  for (;;) {
    try {
      const r = await fetch('/__preview/stamp');
      const { stamp, problems } = await r.json();
      if (last !== null && stamp !== last) location.reload();
      last = stamp;
      const el = document.getElementById('__preview_problems') ?? Object.assign(document.createElement('div'), { id: '__preview_problems' });
      el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;font:13px/1.5 ui-monospace,monospace;background:#7f1d1d;color:#fff;padding:.5rem .8rem;white-space:pre-wrap;max-height:40vh;overflow:auto';
      if (problems.length) { el.textContent = problems.join('\\n'); document.body.appendChild(el); } else el.remove();
    } catch { /* server restarting */ }
    await new Promise((r) => setTimeout(r, 700));
  }
})();
</script>`;

/**
 * A `.course` sent by an author is a zip, not a directory. Unpack it somewhere temporary so it can be
 * previewed like any other course — and check its signature first, because it arrived from outside.
 */
function unpackForPreview(file: string, trustedFile?: string): string {
  const zip = new Uint8Array(readFileSync(file));
  let files;
  try { files = unpackBundle(zip, { onFix: (m) => console.log(`  note: ${m}`) }); }
  catch (e) { console.error(`${file} could not be opened: ${(e as Error).message}`); process.exit(1); }
  const trusted: TrustedKey[] = trustedFile && existsSync(trustedFile) ? JSON.parse(readFileSync(trustedFile, 'utf8')) : [];
  const { hashes, signature, manifest } = verifyBundle(files, trusted);
  console.log(`\n${manifest.title} ${manifest.version}  (${manifest.id})`);
  if (hashes.length) {
    console.error(`  REFUSED — the bundle has been modified since it was signed: ${hashes[0]}`);
    process.exit(1);
  }
  const author = signature.ok ? null : verifyAuthorSignature(files);
  console.log(signature.ok
    ? `  signature ok, signed by ${signature.keyId}`
    : author ? `  signed with the author's own key ${author.fingerprint} — unchanged since they signed it`
    : `  signature ${signature.reason} — previewing anyway, but do not publish a bundle you cannot verify`);
  const dir = mkdtempSync(join(tmpdir(), 'tome-preview-'));
  for (const [rel, bytes] of Object.entries(files)) {
    if (rel.endsWith('/')) continue;
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), bytes);
  }
  return dir;
}

export function previewCommand(dirOrBundle: string, port = 4180, trustedFile?: string) {
  const given = resolve(dirOrBundle);
  if (!existsSync(given)) { console.error(`No such file or directory: ${given}`); process.exit(1); }
  const isBundle = statSync(given).isFile();
  const root = isBundle ? unpackForPreview(given, trustedFile) : findCourseRoot(given);
  // Published, the player ships beside the bundle in `player/`. In the repo it is the Vite build output.
  const here = dirname(fileURLToPath(import.meta.url));
  const playerDir = [join(here, '../player'), join(here, '../../player-web/dist')].find((d) => existsSync(join(d, 'index.html')));
  if (!playerDir) {
    console.error('The player is missing. In a checkout run:  npm run build -w @tome/player-web');
    process.exit(1);
  }
  // Pyodide is a dependency rather than a copy inside the package: 14 MB that npm can cache and share.
  let pyodideDir: string | null = null;
  try { pyodideDir = dirname(createRequire(import.meta.url).resolve('pyodide/package.json')); } catch { /* code exercises will say so */ }

  let problems = report(root);
  let token = stamp(root);
  setInterval(() => {
    const now = stamp(root);
    if (now !== token) { token = now; problems = report(root); }
  }, 500);

  const send = (res: any, code: number, type: string, body: any) => { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };

  createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    const path = decodeURIComponent(url.pathname);

    if (path === '/__preview/stamp') return send(res, 200, 'application/json', JSON.stringify({ stamp: token, problems }));
    // One course, always called "preview", so the player's dev-course list needs no editing.
    if (path === '/courses/index.json') return send(res, 200, 'application/json', '["preview"]');
    if (path === '/courses/preview/manifest.json') {
      try { return send(res, 200, 'application/json', JSON.stringify(liveManifest(root))); }
      catch (e) { return send(res, 500, 'application/json', JSON.stringify({ error: (e as Error).message })); }
    }
    if (path.startsWith('/courses/preview/')) {
      const rel = path.slice('/courses/preview/'.length);
      const file = join(root, rel);
      if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) return send(res, 404, 'text/plain', 'not found');
      return send(res, 200, mime(file), readFileSync(file));
    }
    // The store is not part of previewing; an empty catalogue keeps it from erroring.
    if (path === '/catalog.json') return send(res, 200, 'application/json', '[]');
    if (path.startsWith('/pyodide/')) {
      if (!pyodideDir) return send(res, 503, 'text/plain', 'Pyodide is not installed, so Python exercises cannot run in preview.');
      const f = join(pyodideDir, path.slice('/pyodide/'.length));
      if (!f.startsWith(pyodideDir) || !existsSync(f)) return send(res, 404, 'text/plain', 'not found');
      return send(res, 200, mime(f), readFileSync(f));
    }

    const asset = join(playerDir, path === '/' ? 'index.html' : path.replace(/^\//, ''));
    if (asset.startsWith(playerDir) && existsSync(asset) && !statSync(asset).isDirectory()) {
      if (asset.endsWith('index.html')) return send(res, 200, MIME['.html'], readFileSync(asset, 'utf8').replace('</body>', `${RELOAD}</body>`));
      return send(res, 200, mime(asset), readFileSync(asset));
    }
    return send(res, 200, MIME['.html'], readFileSync(join(playerDir, 'index.html'), 'utf8').replace('</body>', `${RELOAD}</body>`));
  }).listen(port, '127.0.0.1', () => {
    console.log(isBundle ? `\nPreviewing ${given}` : `\nPreviewing ${root}`);
    console.log(`  http://127.0.0.1:${port}/#/preview\n`);
    console.log('Save a file to reload. Errors appear here and at the foot of the page. Ctrl-C to stop.');
  });
}
