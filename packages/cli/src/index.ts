/**
 * tome new <dir>                — scaffold a course that already validates
 * tome preview <course-dir|bundle.course> [port] [keys.json] — serve the player with this course loaded
 * tome unpack <bundle.course> <dir> [keys.json] — turn a received bundle into an editable directory
 * tome validate <course-dir>   — validate a course source directory
 * tome build <course-dir> [out] — validate, write contentHashes, zip to .course (unsigned)
 * tome keygen <out.json>        — create an Ed25519 signing key (keep the private half offline)
 * tome sign <bundle> <key.json> — add signature.json to a built bundle
 * tome verify <bundle> [keys.json] — check hashes and signature the way a player does
 * tome regions <image> [asset-path] — draw hotspot regions in a browser and copy the YAML out
 * tome atoms <smiles>            — list a molecule's atom indices for `molecule` answers
 * tome check-docs <file.md…>     — validate every example in the documentation
 * Shares the parser and the verifier with the web player, so the two cannot disagree.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { parseLesson, validateManifest, manifestLessons, walk, widgetAssets, widgetUses, widgetWarnings, copiedExampleWarnings, checkListening, bodyAssets, generateKeyPair, unpackBundle, packBundle, signBundle, verifyBundle, verifyAuthorSignature, type Manifest, type Problem } from '@tome/core';

// `--out <dir>` is accepted as a flag as well as positionally; without this it silently became a
// directory called "--out".
const argv = process.argv.slice(2);
const outFlag = argv.indexOf('--out');
const outValue = outFlag >= 0 ? argv[outFlag + 1] : undefined;
if (outFlag >= 0) argv.splice(outFlag, outValue === undefined ? 1 : 2);
const [cmd, dirArg, positionalOut] = argv;
const outArg = outValue ?? positionalOut;
if (!cmd || !dirArg) { console.log(`usage: tome <command>

  new <dir>                          scaffold a course
  preview <dir|bundle.course> [port] [keys.json]
                                     serve the player with this course, reloading on save
  validate <dir>                     check a course
  build <dir> --out <dir>            write content hashes, produce a .course bundle
  unpack <bundle.course> <dir> [keys.json]
                                     turn a received bundle into an editable directory
  keygen <key.json> [keyId]          create an Ed25519 signing key (author-… unless you name it)
  sign <bundle> <key.json>           sign a bundle
  verify <bundle> [keys.json]        check hashes and signature
  regions <image> [asset-path]       draw hotspot regions in a browser
  atoms <smiles>                     list a molecule's atom indices
  check-docs <file.md…>              validate examples in documentation`); process.exit(2); }

if (cmd === 'unpack') {
  const { unpackCommand } = await import('./unpack.ts');
  if (!outArg) { console.log('usage: tome unpack <bundle.course> <dir> [keys.json]'); process.exit(2); }
  unpackCommand(dirArg, outArg, argv[3]);
  process.exit(0);
} else if (cmd === 'preview') {
  const { previewCommand } = await import('./preview.ts');
  // `tome preview x.course 4180 keys.json` — port and trusted keys are both optional and order-tolerant.
  const rest = argv.slice(2).filter(Boolean);
  const port = Number(rest.find((a) => /^\d+$/.test(a))) || 4180;
  const keys = rest.find((a) => a.endsWith('.json'));
  previewCommand(dirArg, port, keys);
  await new Promise<never>(() => {}); // serves until Ctrl-C
} else if (cmd === 'check-docs') {
  const { checkDocsCommand } = await import('./checkdocs.ts');
  checkDocsCommand(argv.slice(1));
} else if (cmd === 'new') {
  const { newCommand } = await import('./scaffold.ts');
  newCommand(dirArg);
  process.exit(0);
} else if (cmd === 'atoms') {
  const { atomsCommand } = await import('./atoms.ts');
  atomsCommand(dirArg);
  process.exit(0);
} else if (cmd === 'regions') {
  const { regionsCommand } = await import('./regions.ts');
  regionsCommand(dirArg, outArg);
  await new Promise<never>(() => {}); // the editor serves until Ctrl-C; nothing below should run
} else if (cmd === 'keygen') {
  // `tome keygen key.json [keyId]`. Authors' keys are named author-…, so they can never look like a platform key.
  const kp = generateKeyPair(); const keyId = outArg ?? `author-${new Date().toISOString().slice(0, 10)}-${kp.publicKey.slice(0, 6)}`;
  if (!dirArg) { console.log('usage: tome keygen <key.json> [keyId]'); process.exit(2); }
  // Never overwrite a key: losing a platform key means no more course updates.
  if (existsSync(dirArg)) { console.error(`${dirArg} already exists. A key cannot be replaced by accident: choose another file name, or delete that file first if you really mean to.`); process.exit(1); }
  mkdirSync(dirname(resolve(dirArg)), { recursive: true });
  writeFileSync(dirArg, JSON.stringify({ keyId, ...kp }, null, 2), { mode: 0o600 });
  const { keyFingerprint } = await import('@tome/core');
  console.log(`Wrote ${dirArg} (keyId ${keyId}, fingerprint ${keyFingerprint(kp.publicKey)}). Keep this file private; it is what proves a course is yours.`); process.exit(0);
}
if (cmd === 'sign') {
  if (!outArg) { console.log('usage: tome sign <bundle.course> <key.json>'); process.exit(2); }
  const key = JSON.parse(readFileSync(outArg, 'utf8'));
  const files = unpackBundle(new Uint8Array(readFileSync(dirArg)), { onFix: (m) => console.log(`  note: ${m}`) });
  if (!files['manifest.json']) { console.error(`  ${dirArg} is not a course bundle: no manifest.json at the root.`); process.exit(1); }
  writeFileSync(dirArg, packBundle(signBundle(files, key.privateKey, key.keyId)));
  const { keyFingerprint } = await import('@tome/core');
  console.log(`Signed ${dirArg} with ${key.keyId} (fingerprint ${keyFingerprint(key.publicKey)}). Tell the people you send it to this fingerprint, so they can recognise courses from you.`); process.exit(0);
}
if (cmd === 'verify') {
  const files = unpackBundle(new Uint8Array(readFileSync(dirArg)), { onFix: (m) => console.log(`  note: ${m}`) });
  const trusted = outArg ? JSON.parse(readFileSync(outArg, 'utf8')) : [];
  let r;
  try { r = verifyBundle(files, trusted); }
  catch (e) { console.error(`  ${(e as Error).message}`); process.exit(1); }
  for (const h of r.hashes) console.log(`  HASH  ${h}`);
  let author = r.signature.ok ? null : verifyAuthorSignature(files);
  if (author && trusted.some((k: any) => k.keyId === author!.keyId)) { console.log(`  SIGNATURE claims the trusted key ${author.keyId} but does not verify with it — impersonation`); author = null; process.exitCode = 1; }
  else console.log(r.signature.ok ? `  SIGNATURE ok (${r.signature.keyId})` : author ? `  SIGNATURE author's own key, fingerprint ${author.fingerprint} (not a trusted key: unchanged since signing, not reviewed)` : `  SIGNATURE ${r.signature.reason}`);
  const it = r.manifest.issuedTo;
  if (it && r.signature.ok) console.log(`  ISSUED FOR order ${it.order}${it.name ? ` (${it.name})` : ''}, account ${it.subject}, ${it.issuedAt}`);
  console.log(`${r.manifest.title} ${r.manifest.version} — ${r.hashes.length === 0 && r.signature.ok ? 'trusted' : r.hashes.length === 0 && author ? "an author's own course (intact, not from the store)" : 'NOT trusted'}`);
  process.exit(r.hashes.length === 0 && r.signature.ok ? 0 : 1);
}
const { findCourseRoot } = await import('./courseroot.ts');
const root = findCourseRoot(dirArg);

const files = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? files(p) : [p]; });
const problems: (Problem & { file: string })[] = [];
const err = (file: string, message: string, line?: number) => problems.push({ level: 'error', message, file, line });
const warn = (file: string, message: string) => problems.push({ level: 'warning', message, file });

const mPath = existsSync(join(root, 'manifest.json.in')) ? 'manifest.json.in' : 'manifest.json';
const manifest: Manifest = JSON.parse(readFileSync(join(root, mPath), 'utf8'));
const all = files(root).map((p) => relative(root, p).replaceAll('\\', '/')).filter((p) => !['manifest.json', 'manifest.json.in', 'signature.json'].includes(p));
manifest.contentHashes = Object.fromEntries(all.sort().map((p) => [p, 'sha256:' + createHash('sha256').update(readFileSync(join(root, p))).digest('hex')]));
manifest.formatVersion = manifest.formatVersion ?? '1.0.0-rc.1'; // the author declares the target; the schema decides if it is one we know
for (const m of validateManifest(manifest)) err('manifest.json', m);
// A purchased copy carries its buyer (§3.4). In a source folder that means someone is republishing a bought copy.
if (manifest.issuedTo) err('manifest.json', `"issuedTo" is added by the store to each purchased copy and must not be in a course's source. This folder looks like an unpacked copy from order ${manifest.issuedTo.order}.`);
for (const p of all) if (!/^[A-Za-z0-9._/-]+$/.test(p)) err(p, 'Path contains characters outside [A-Za-z0-9._/-]');
const { checkAssets, human } = await import('./assetcheck.ts');
const sizes = checkAssets(root, all, err, warn);

const lessons = manifestLessons(manifest);
const lessonIds = new Set(lessons.map((l) => l.replace(/^.*\//, '').replace(/\.md$/, '')));
const widgetIds = new Map<string, string>();
let widgetCount = 0;
const uses = new Set<string>();
// §3.3: every displayed asset must be either the author's own work or credited.
const credited = new Set((manifest.credits ?? []).map((c) => c.asset));
const displayed = new Map<string, boolean>(); // path -> credited inline by a figure
for (const l of lessons) {
  if (!existsSync(join(root, l))) { err(l, 'Lesson listed in manifest does not exist'); continue; }
  const parsed = parseLesson(l, readFileSync(join(root, l), 'utf8'));
  parsed.problems.forEach((p) => problems.push({ ...p, file: l }));
  widgetCount += parsed.widgets.length;
  for (const w of parsed.widgets) {
    if (widgetIds.has(w.id)) err(l, `Duplicate widget id '${w.id}' (also in ${widgetIds.get(w.id)})`); widgetIds.set(w.id, l);
    const a = widgetAssets(w);
    for (const p of [...a.audio, ...a.images]) if (!existsSync(join(root, p))) err(l, `Widget '${w.id}': missing asset ${p}`);
    for (const p of a.untranscribed) warn(l, `Widget '${w.id}': audio ${p} has no transcript`);
    for (const m of widgetWarnings(w)) warn(l, `Widget '${w.id}': ${m}`);
    for (const p of [...a.audio, ...a.images]) if (!displayed.has(p)) displayed.set(p, false);
    widgetUses(w).forEach((u) => uses.add(u));
  }
  for (const a of bodyAssets(parsed.tree)) displayed.set(a.path, (displayed.get(a.path) ?? false) || a.credited);
  for (const c of copiedExampleWarnings(parsed.tree, parsed.widgets)) warn(l, `Widget '${c.id}': ${c.message}`);
  const lg = checkListening(parsed.tree, parsed.widgets);
  for (const m of lg.problems) (m.endsWith('(warning)') ? warn : err)(l, m.replace(' (warning)', ''));
  for (const a of lg.audio) { uses.add('audio'); if (!existsSync(join(root, a))) err(l, `:::listening: missing asset ${a}`); }
  if (!parsed.widgets.length) warn(l, 'Lesson has no widgets');
  let checkpoints = 0;
  walk(parsed.tree, (n: any) => {
    if (n.type === 'containerDirective' && n.name === 'checkpoint') checkpoints++;
    if (n.type === 'image' && n.url.startsWith('assets/') && !existsSync(join(root, n.url))) err(l, `Missing asset ${n.url}`, n.position?.start.line);
    if (n.type === 'containerDirective' && n.attributes?.src && !existsSync(join(root, n.attributes.src))) err(l, `Missing asset ${n.attributes.src}`, n.position?.start.line);
    if (n.type === 'link' && n.url.startsWith('lesson:') && !lessonIds.has(n.url.slice(7).split('#')[0])) err(l, `Broken lesson link ${n.url}`, n.position?.start.line);
  });
  if (!checkpoints) warn(l, 'Lesson has no checkpoint; it can never be marked complete');
}
for (const p of all) if (p.startsWith('lessons/') && !lessons.includes(p)) warn(p, 'Lesson file not referenced in manifest');
if (!existsSync(join(root, manifest.cover))) err('manifest.json', `Cover image ${manifest.cover} missing`);
for (const c of manifest.credits ?? []) if (!existsSync(join(root, c.asset))) err('manifest.json', `credits: no such asset ${c.asset}`);
if (!manifest.assetsByAuthor) {
  const missing = [...displayed].filter(([p, inline]) => !inline && !credited.has(p)).map(([p]) => p);
  for (const p of missing.slice(0, 10)) err('manifest.json', `Asset ${p} has no credit. Add a credits entry, a figure credit, or set assetsByAuthor: true (§3.3)`);
  if (missing.length > 10) err('manifest.json', `…and ${missing.length - 10} more uncredited assets`);
}
if (manifest.cover && !manifest.assetsByAuthor && !credited.has(manifest.cover)) err('manifest.json', `Cover ${manifest.cover} has no credit (§3.3)`);
for (const u of uses) if (!(manifest.uses ?? []).includes(u)) err('manifest.json', `Course uses '${u}' but manifest.uses does not declare it`);
for (const u of manifest.uses ?? []) if (!uses.has(u)) warn('manifest.json', `manifest.uses declares '${u}' but no widget needs it`);

const errors = problems.filter((p) => p.level === 'error');
console.log(`${manifest.title} — ${lessons.length} lessons, ${widgetCount} widgets`);
// Size report: an image-heavy course should see its weight before it is sent anywhere.
const total = sizes.reduce((n, [, b]) => n + b, 0);
const largest = [...sizes].sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([, b]) => b > 200 * 1024);
console.log(`${human(total)} in ${sizes.length} files${largest.length ? ` — largest: ${largest.map(([p, b]) => `${p.split('/').pop()} ${human(b)}`).join(', ')}` : ''}`);
for (const p of problems) console.log(`  ${p.level === 'error' ? 'ERROR' : 'warn '}  ${p.file}${p.line ? ':' + p.line : ''}  ${p.message}`);
if (errors.length) { console.log(`\n${errors.length} error(s).`); process.exit(1); }
console.log(problems.length ? `\nNo errors, ${problems.length} warning(s).` : '\nValid.');

if (cmd === 'build') {
  const out = resolve(outArg ?? '.');
  mkdirSync(out, { recursive: true });
  // Built in-process: no system `zip` (absent on Windows), and the generated manifest.json goes into
  // the bundle only — never into the author's source directory.
  const bundle: Record<string, Uint8Array> = { 'manifest.json': new TextEncoder().encode(JSON.stringify(manifest, null, 2) + '\n') };
  for (const p of all) bundle[p] = new Uint8Array(readFileSync(join(root, p)));
  const name = `${manifest.id}-${manifest.version}.course`;
  const zip = packBundle(bundle);
  writeFileSync(join(out, name), zip);
  console.log(`Wrote ${join(out, name)} (${human(zip.byteLength)})`);
}
