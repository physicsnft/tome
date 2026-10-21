/**
 * `tome unpack <bundle.course> <dir>` — turn a received bundle back into an editable course directory.
 *
 * A `.course` is a zip, so this is not strictly necessary; it exists so that reviewing someone else's
 * course does not start with "work out that it is a zip and that manifest.json is generated". The
 * manifest is written back as `manifest.json.in` with the hashes stripped, which is the form an author
 * edits — otherwise the first `tome build` would silently disagree with the file on disk.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { unpackBundle, verifyBundle, type TrustedKey } from '@tome/core';

export function unpackCommand(bundle: string, outDir: string, trustedFile?: string) {
  const file = resolve(bundle);
  if (!existsSync(file)) { console.error(`No such file: ${file}`); process.exit(1); }
  const out = resolve(outDir);
  if (existsSync(out)) { console.error(`${out} already exists — pick a directory that does not.`); process.exit(1); }

  let files;
  try { files = unpackBundle(new Uint8Array(readFileSync(file)), { onFix: (m) => console.log(`  note: ${m}`) }); }
  catch (e) { console.error(`${file} could not be opened: ${(e as Error).message}`); process.exit(1); }

  const trusted: TrustedKey[] = trustedFile && existsSync(trustedFile) ? JSON.parse(readFileSync(trustedFile, 'utf8')) : [];
  const { hashes, signature, manifest } = verifyBundle(files, trusted);
  for (const h of hashes) console.log(`  HASH  ${h}`);
  console.log(signature.ok ? `  signature ok (${signature.keyId})` : `  signature ${signature.reason}`);

  for (const [rel, bytes] of Object.entries(files)) {
    if (rel.endsWith('/') || rel === 'manifest.json' || rel === 'signature.json') continue;
    mkdirSync(dirname(join(out, rel)), { recursive: true });
    writeFileSync(join(out, rel), bytes);
  }
  const source = { ...manifest, contentHashes: {} };
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'manifest.json.in'), JSON.stringify(source, null, 2) + '\n');

  console.log(`\n${manifest.title} ${manifest.version} → ${out}`);
  console.log(`  tome validate ${outDir}\n  tome preview ${outDir}`);
}
